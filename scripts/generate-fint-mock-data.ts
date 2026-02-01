import { writeFileSync } from "node:fs"
import { logger } from "@vestfoldfylke/loglady"
import { generateMockFintSchoolsWithStudents } from "../src/lib/fint/generate-fint-mock-data"
import type { FintSchoolWithStudents } from "../src/types/fint/fint-school-with-students"

logger.info("Generating mock FINT schools with students...")

const mockSchools: FintSchoolWithStudents[] = generateMockFintSchoolsWithStudents({
	numberOfKlasser: 5,
	numberOfKontaktlarergrupper: 3,
	numberOfUndervisningsgrupper: 4,
	numberOfUndervisningsforhold: 6,
	numberOfStudents: 50,
	schoolNames: ["Mordor VGS", "Hobbitun VGS", "Gondor VGS"]
})

writeFileSync("./src/lib/fint/mock-fint-schools.json", JSON.stringify(mockSchools, null, 2))

logger.info("Finished generating mock FINT schools with students.")
