import { app, type InvocationContext, type Timer } from "@azure/functions"
import { logger } from "@vestfoldfylke/loglady"
import { syncDbData } from "../lib/sync-db-data/sync-db-data.js"

export async function SyncStudentsAndAccess_timer(_myTimer: Timer, _context: InvocationContext): Promise<void> {
  logger.info("Starting to sync db data via timer trigger")

  try {
    await syncDbData()
  } catch (error) {
    logger.errorException(error, "Failed to sync db data")
  }
}

app.timer("SyncStudentsAndAccess_timer", {
  schedule: "%SyncDbDataSchedule%",
  handler: SyncStudentsAndAccess_timer
})
