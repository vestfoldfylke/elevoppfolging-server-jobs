import type { EmailAlertReceiver, EmailAlertStatus, NewDbEmailAlert } from "../db/shared-types.js"

export type SmtpConfig = {
  baseUrl: string
  apiKey: string
  fromAddress: string
}

export type SmtpMessage = {
  error?: string
  receiver: string
  status: EmailAlertStatus
}

export type SmtpSendResponse = {
  [messageId: string]: string
}

export type SmtpStatusResponse = {
  event: "attempt" | "delivery" | "failure" | "retry"
  id: string
  recipient: string
  time: string
  code: number | null
  status: string | null
  description: string | null
}

export interface ISmtpClient {
  getEmailStatus: (messageId: string) => Promise<SmtpMessage>
  sendEmail: (receivers: EmailAlertReceiver[], emailAlert: NewDbEmailAlert["alertBody"]) => Promise<SmtpSendResponse>
}
