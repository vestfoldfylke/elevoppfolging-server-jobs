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
}
