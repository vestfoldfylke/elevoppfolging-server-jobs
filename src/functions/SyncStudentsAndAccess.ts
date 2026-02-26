import { app, type HttpResponseInit } from "@azure/functions"
import type { User } from "@microsoft/microsoft-graph-types"
import { logger } from "@vestfoldfylke/loglady"
import { getDbClient } from "../lib/db/get-db-client.js"
import { getEntraClient } from "../lib/entra/get-entra-client.js"
import { getFintClient } from "../lib/fint/get-fint-client.js"
import { updateUsersStudentsAndAccess } from "../lib/sync-db-data/users-students-and-access.js"
import type { IDbClient } from "../types/db/db-client.js"
import type { IEntraClient } from "../types/entra/entra-client.js"
import type { IFintClient } from "../types/fint/fint-client.js"
import type { FintSkoleInfo } from "../types/fint/fint-school.js"
import type { FintSchoolWithStudents } from "../types/fint/fint-school-with-students.js"

export async function SyncUsersAndStudents(): Promise<HttpResponseInit> {
  const fintClient: IFintClient = getFintClient()
  const entraClient: IEntraClient = getEntraClient()
  const dbClient: IDbClient = getDbClient()

  logger.info("Fetching schools with students from FINT...")
  const schoolsWithStudents: FintSchoolWithStudents[] = []
  const schools: FintSkoleInfo[] = await fintClient.getSchools()
  logger.info(`Fetched ${schools.length} schools with from FINT. Now fetching students for each school...`)
  for (const skole of schools) {
    if (!skole.skolenummer) {
      logger.warn(`School ${skole.navn} is missing school number, skipping...`)
      continue
    }
    logger.info(`Fetching students for school ${skole.navn} (${skole.skolenummer.identifikatorverdi})...`)
    const schoolWithStudents = await fintClient.getSchoolWithStudents(skole.skolenummer.identifikatorverdi)
    schoolsWithStudents.push(schoolWithStudents)
    logger.info(`Fetched ${schoolWithStudents.skole?.elevforhold?.length} elevforhold for school ${skole.navn} (${skole.skolenummer.identifikatorverdi})`)
  }
  logger.info(`Fetched students for all ${schoolsWithStudents.length} schools.`)

  logger.info("Fetching app users from EntraID...")
  const appUsers: User[] = await entraClient.getEnterpriseApplicationUsers()
  logger.info(`Fetched ${appUsers.length} app users from EntraID.`)

  logger.info("Fetching users from database...")
  const dbUsers = await dbClient.getUsers()
  logger.info(`Fetched ${dbUsers.length} users from database.`)

  logger.info("Fetching students from database...")
  const dbStudents = await dbClient.getStudents()
  logger.info(`Fetched ${dbStudents.length} students from database.`)

  logger.info("Fetching access records from database...")
  const dbAccess = await dbClient.getAccess()
  logger.info(`Fetched ${dbAccess.length} access records from database.`)

  logger.info("Fetching schools records from database...")
  const dbSchools = await dbClient.getSchools()
  logger.info(`Fetched ${dbSchools.length} schools records from database.`)

  logger.info("Syncing users and students...")

  const updatedData = updateUsersStudentsAndAccess(dbUsers, dbStudents, dbAccess, dbSchools, schoolsWithStudents, appUsers)

  logger.info("Updating database with new users, students and access records...")
  await dbClient.replaceUsers(updatedData.updatedAppUsers)
  logger.info("Updated users in database.")
  await dbClient.replaceStudents(updatedData.updatedStudents)
  logger.info("Updated students in database.")
  await dbClient.replaceAccess(updatedData.updatedAccess)
  logger.info("Updated access records in database.")
  await dbClient.replaceSchools(updatedData.updatedSchools)
  logger.info("Updated schools records in database.")

  logger.info("Sync completed successfully.")

  return { body: `Hello balle!` }
}

app.http("SyncStudentsAndAccess", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: SyncUsersAndStudents
})
