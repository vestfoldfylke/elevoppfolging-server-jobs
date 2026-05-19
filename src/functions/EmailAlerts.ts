import { app, type InvocationContext, type Timer } from "@azure/functions"
import { logger } from "@vestfoldfylke/loglady"
import { getDbClient } from "../lib/db/get-db-client.js"
import { getSmtpClient } from "../lib/smtp/get-smtp-client.js"
import type { IDbClient } from "../types/db/db-client.js"
import type { DbEmailAlert } from "../types/db/shared-types.js"
import type { ISmtpClient, SmtpSendResponse } from "../types/smtp/smtp-client.js"

const dbClient: IDbClient = getDbClient()
const smtpClient: ISmtpClient = getSmtpClient()

export async function EmailAlerts(_myTimer: Timer, _context: InvocationContext): Promise<void> {
  logger.info("EmailAlerts function starting")

  const emailAlerts: DbEmailAlert[] = await dbClient.getEmailAlertsToHandle()
  logger.info("{EmailAlertCount} EmailAlerts to handle found", emailAlerts.length)

  for (const emailAlert of emailAlerts) {
    try {
      await handleEmailAlert(emailAlert)
    } catch {}
  }
}

const handleEmailAlert = async (emailAlert: DbEmailAlert): Promise<void> => {
  if (emailAlert.status !== "QUEUED") {
    logger.error("EmailAlert status is not QUEUED: {@EmailAlert}", emailAlert)
    return
  }

  const smtpResponses: SmtpSendResponse = await smtpClient.sendEmail(emailAlert.receivers, emailAlert.alertBody)
  const smtpResponseEntries: [string, string][] = Object.entries(smtpResponses)

  for (const emailAlertReceiver of emailAlert.receivers) {
    const messageId: string | undefined = smtpResponseEntries.find((entry: [string, string]) => entry[1] === emailAlertReceiver.receiver)?.[0]
    if (!messageId) {
      logger.error("SMTP response for receiver {AlertReceiver} does not exist 😱", emailAlertReceiver.receiver)
      emailAlertReceiver.status = "FAILED"

      continue
    }

    emailAlertReceiver.status = "SENT"
    emailAlertReceiver.messageId = messageId
  }

  emailAlert.status = "SENT"
  await dbClient.updateEmailAlert(emailAlert)
}

app.timer("EmailAlerts", {
  schedule: "0 */1 * * * *",
  handler: EmailAlerts
})
