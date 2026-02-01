import { existsSync, readFileSync } from "fs"
import type { IFintClient } from "../../types/fint/fint-client"
import type { FintSkoleInfo } from "../../types/fint/fint-school"
import type { FintSchoolWithStudents } from "../../types/fint/fint-school-with-students"

export class MockFintClient implements IFintClient {
	private mockSchools: FintSchoolWithStudents[]
	constructor() {
		if (!existsSync("./src/lib/fint/mock-schools.json")) {
			throw new Error("Mock schools file not found at ./src/lib/fint/mock-schools.json - please run 'npm run generate-fint-mock-data' to create it")
		}
		const fileContent = readFileSync("./src/lib/fint/mock-schools.json", "utf-8")
		try {
			this.mockSchools = JSON.parse(fileContent) as FintSchoolWithStudents[]
		} catch (error) {
			throw new Error(`Error parsing mock schools JSON file: ${(error as Error).message}`)
		}
	}

	async getSchools(): Promise<FintSkoleInfo[]> {
		return this.mockSchools.map((s) => {
			if (!s.skole) {
				throw new Error("School data is missing skole property")
			}
			return {
				skolenummer: s.skole?.skolenummer,
				navn: s.skole?.navn
			}
		})
	}
	async getSchoolWithStudents(schoolNumber: string): Promise<FintSchoolWithStudents> {
		const mockSchool = this.mockSchools.find((s) => s.skole?.skolenummer.identifikatorverdi === schoolNumber)
		if (!mockSchool) {
			throw new Error(`Mock school with school number ${schoolNumber} not found`)
		}
		return mockSchool
	}
}
