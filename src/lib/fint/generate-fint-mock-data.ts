import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { logger } from "@vestfoldfylke/loglady"
import { MOCK_FINT_DATA_PATH } from "../../config.js"
import { getStaticMockFintSchools } from "../../mock-data/static-mock-fint-schools.js"
import type { MockFintSchool } from "../../types/fint/fint-mock.js"
import type { FintSchoolWithStudents, FintSkole } from "../../types/fint/fint-school-with-students.js"
import { generateMockFintSchoolsWithStudents } from "./generate-fint-mock-schools-with-students.js"

export const generateFintMockData = (): void => {
  logger.info("Generating mock FINT schools with students...")

  const schools: MockFintSchool[] = [
    {
      name: "Mordor VGS",
      schoolNumber: "55074744"
    },
    {
      name: "Hobbitun VGS",
      schoolNumber: "33362297"
    },
    {
      name: "Gondor VGS",
      schoolNumber: "17616906"
    }
  ]

  const predefinedSchoolStudents: FintSkole[] = getStaticMockFintSchools(schools)

  const mockSchools: FintSchoolWithStudents[] = generateMockFintSchoolsWithStudents({
    minimumNumberOfStudentsWithBlockedAddress: 4,
    numberOfKlasser: 250,
    numberOfKontaktlarergrupper: 100,
    numberOfUndervisningsgrupper: 600,
    numberOfTeachers: 2000,
    numberOfStudents: 10000,
    predefinedSchoolStudents,
    schools
  })

  const mockDataDir: string = MOCK_FINT_DATA_PATH ? dirname(MOCK_FINT_DATA_PATH) : "./mock-data"
  if (!existsSync(mockDataDir)) {
    logger.info("Creating mock-data directory {DirectoryName}...", mockDataDir)
    mkdirSync(mockDataDir)
  }

  const mockFintDataPath: string = MOCK_FINT_DATA_PATH || `${mockDataDir}/mock-fint-schools.json`
  writeFileSync(mockFintDataPath, JSON.stringify(mockSchools, null, 2))

  logger.info("Finished generating mock FINT schools with students. Saved to {MockFintDataPath}", mockFintDataPath)
}
