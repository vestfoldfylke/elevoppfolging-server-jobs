import type { FintSkole } from "./fint-school-with-students.js"

export type MockFintSchool = {
  name: string
  schoolNumber: string
}

export type GenerateMockFintSchoolsWithStudentsOptions = {
  schools: MockFintSchool[]
  numberOfStudents: number
  numberOfKlasser: number
  numberOfUndervisningsgrupper: number
  numberOfKontaktlarergrupper: number
  numberOfTeachers: number
  minimumNumberOfStudentsWithBlockedAddress: number
  predefinedSchoolStudents: FintSkole[]
}
