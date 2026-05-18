import { logger } from "@vestfoldfylke/loglady"
import { getSmtpConfig } from "../../config.js"
import type { EmailAlertReceiver, NewDbEmailAlert } from "../../types/db/shared-types.js"
import type { ISmtpClient, SmtpConfig, SmtpMessage, SmtpSendResponse, SmtpStatusResponse } from "../../types/smtp/smtp-client.js"

export class SmtpClient implements ISmtpClient {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly fromAddress: string

  constructor() {
    const smtpConfig: SmtpConfig = getSmtpConfig()

    this.baseUrl = smtpConfig.baseUrl
    this.apiKey = smtpConfig.apiKey
    this.fromAddress = smtpConfig.fromAddress
  }

  async getEmailStatus(messageId: string): Promise<SmtpMessage> {
    const response: Response = await fetch(`${this.baseUrl}/status/${messageId}`, {
      method: "GET",
      headers: {
        "X-Functions-Key": this.apiKey
      }
    })

    if (!response.ok) {
      const error = await response.json()
      logger.error("Failed to get smtp status for MessageId {MessageId}. Error: {@Error}", messageId, error)
      throw new Error(`Failed to get smtp status for MessageId ${messageId}. Error: ${JSON.stringify(error)}`)
    }

    const smtpResponses: SmtpStatusResponse[] = await response.json()
    if (!Array.isArray(smtpResponses)) {
      logger.error("Invalid response format when getting smtp status for MessageId {MessageId}. Expected an array but got: {@Response}", messageId, smtpResponses)
      throw new Error(`Invalid response format when getting smtp status for MessageId ${messageId}`)
    }

    if (smtpResponses.length === 0) {
      logger.error("Empty event array response found for MessageId {MessageId}", messageId)
      throw new Error(`Empty event array response found for MessageId ${messageId}`)
    }

    const smtpResponse: SmtpStatusResponse = smtpResponses[-1]

    if (smtpResponse.event === "attempt") {
      return {
        receiver: smtpResponse.recipient,
        status: "QUEUED"
      }
    }

    if (smtpResponse.event === "delivery" || smtpResponse.event === "retry") {
      return {
        receiver: smtpResponse.recipient,
        status: "SENT"
      }
    }

    if (smtpResponse.event === "failure") {
      return {
        receiver: smtpResponse.recipient,
        status: "FAILED",
        error: smtpResponse.description || "Unknown error"
      }
    }

    logger.error("Unknown response event {Event} retrieved for MessageId {MessageId}. Response: {@Response}", smtpResponse.event, messageId, smtpResponse)
    throw new Error(`Unknown response event ${smtpResponse.event} retrieved for MessageId ${messageId}`)
  }

  async sendEmail(receivers: EmailAlertReceiver[], emailAlert: NewDbEmailAlert["alertBody"]): Promise<SmtpSendResponse> {
    const payload = {
      from: this.fromAddress,
      to: receivers.map((receiver: EmailAlertReceiver) => receiver.receiver),
      subject: emailAlert.subject,
      html: emailAlert.body,
      template: {
        templateName: "vestfoldfylke",
        templateData: {
          body: emailAlert.body,
          signature: {
            company: "Vestfold fylkeskommune",
            name: "Elevoppfølging"
          }
        }
      }
    }

    logger.info("Sending email to {ReceiverCount} receivers", receivers.length)
    const response: Response = await fetch(`${this.baseUrl}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Functions-Key": this.apiKey
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json()
      logger.error("Failed to send smtp message with {RecipientCount} recipients. Error: {@Error}", receivers.length, error)
      throw new Error(`Failed to send smtp message with ${receivers.length} recipients. Error: ${JSON.stringify(error)}`)
    }

    logger.info("Email sent to {ReceiverCount} receivers", receivers.length)
    return await response.json()
  }
}
