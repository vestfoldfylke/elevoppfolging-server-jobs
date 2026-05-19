import { logger } from "@vestfoldfylke/loglady"
import type { EmailAlertReceiver, NewDbEmailAlert } from "../../types/db/shared-types.js"
import type { ISmtpClient, SmtpMessage, SmtpSendResponse, SmtpStatusResponse } from "../../types/smtp/smtp-client.js"

export class MockSmtpClient implements ISmtpClient {
  async getEmailStatus(messageId: string): Promise<SmtpMessage> {
    const event: SmtpStatusResponse["event"] = this.getRandomEmailStatus()

    const smtpResponse: SmtpStatusResponse = {
      event,
      status: event === "failure" ? "Simulated status" : null,
      description: event === "failure" ? "Simulated failure" : null,
      recipient: "Simulated recipient",
      code: event === "failure" ? 500 : null,
      time: new Date().toISOString().replace("T", " ").substring(0, 19),
      id: messageId
    }

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
    logger.info("Sending email to {ReceiverCount} receivers with subject '{Subject}' and body '{Body}'", receivers.length, emailAlert.subject, emailAlert.body)

    const response: SmtpSendResponse = {}
    receivers.forEach((receiver: EmailAlertReceiver) => {
      response[`message-id-${Math.random() * 1000}`] = receiver.receiver
    })

    return response
  }

  private getRandomEmailStatus(): SmtpStatusResponse["event"] {
    const randomNum: number = Math.floor(Math.random() * 4)

    if (randomNum === 0) {
      return "attempt"
    }

    if (randomNum === 1) {
      return "delivery"
    }

    if (randomNum === 2) {
      return "failure"
    }

    if (randomNum === 3) {
      return "retry"
    }

    return "delivery"
  }
}
