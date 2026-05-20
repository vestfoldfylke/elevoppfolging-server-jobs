import { app, type HttpResponseInit } from "@azure/functions"
import { logger } from "@vestfoldfylke/loglady"
import { syncDbData } from "../lib/sync-db-data/sync-db-data.js"

export async function SyncUsersAndStudents(): Promise<HttpResponseInit> {
  logger.info("Starting to sync db data via HTTP trigger")

  try {
    await syncDbData()
  } catch (error) {
    logger.errorException(error, "Failed to sync db data")

    return {
      status: 500,
      body: "Failed to sync db data"
    }
  }

  return {
    body: "Successfully synced db data"
  }
}

app.http("SyncStudentsAndAccess", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: SyncUsersAndStudents
})
