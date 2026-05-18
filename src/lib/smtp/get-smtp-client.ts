import { MOCK_SMTP } from "../../config.js"
import type { ISmtpClient } from "../../types/smtp/smtp-client.js"
import { MockSmtpClient } from "./mock-smtp-client.js"
import { SmtpClient } from "./smtp-client.js"

const smtpClient: ISmtpClient = MOCK_SMTP ? new MockSmtpClient() : new SmtpClient()

export const getSmtpClient = (): ISmtpClient => smtpClient
