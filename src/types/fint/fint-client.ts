import type { FintSkoleInfo } from "./fint-school.js"
import type { FintSchoolWithStudents } from "./fint-school-with-students.js"

export interface IFintClient {
	/** Henter alle elever fra FINT APIet */
	getSchools: () => Promise<FintSkoleInfo[]>
	getSchoolWithStudents: (schoolNumber: string) => Promise<FintSchoolWithStudents>
}
