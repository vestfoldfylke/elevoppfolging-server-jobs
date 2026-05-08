import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { logger } from "@vestfoldfylke/loglady"
import { generateMockFintSchoolsWithStudents } from "../src/lib/fint/generate-fint-mock-data.js"
import type { FintSchoolWithStudents } from "../src/types/fint/fint-school-with-students.js"

logger.info("Generating mock FINT schools with students...")

const mockSchools: FintSchoolWithStudents[] = generateMockFintSchoolsWithStudents({
  minimumNumberOfStudentsWithBlockedAddress: 4,
  numberOfKlasser: 250,
  numberOfKontaktlarergrupper: 100,
  numberOfUndervisningsgrupper: 600,
  numberOfTeachers: 2000,
  numberOfStudents: 10000,
  schools: [
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
})

if (!existsSync("./mock-data")) {
  logger.info("Creating mock-data directory...")
  mkdirSync("./mock-data")
}

writeFileSync("./mock-data/mock-fint-schools.json", JSON.stringify(mockSchools, null, 2))

logger.info("Finished generating mock FINT schools with students.")
