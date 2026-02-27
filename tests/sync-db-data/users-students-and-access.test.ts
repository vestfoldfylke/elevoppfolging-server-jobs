import assert from "node:assert"
import { writeFileSync } from "node:fs"
import { describe, it } from "node:test"
import { ObjectId } from "mongodb"
import { getEntraClient } from "../../src/lib/entra/get-entra-client.js"
import { generateMockFintSchoolsWithStudents } from "../../src/lib/fint/generate-fint-mock-data.js"
import { repackPeriode, updateUsersStudentsAndAccess } from "../../src/lib/sync-db-data/users-students-and-access.js"
import type { DbAccess, DbAppStudent, DbAppUser, DbSchool, EditorData, NewAccess, NewAppUser, NewSchool, SchoolInfo } from "../../src/types/db/shared-types.js"
import type { GenerateMockFintSchoolsWithStudentsOptions } from "../../src/types/fint/fint-mock.js"
import type {
  FintElev,
  FintElevforhold,
  FintGyldighetsPeriode,
  FintKlassemedlemskap,
  FintKontaktlarergruppemedlemskap,
  FintSchoolWithStudents,
  FintUndervisningsgruppemedlemskap
} from "../../src/types/fint/fint-school-with-students.js"

const isValidAutoAccess = (access: DbAccess | NewAccess, schoolsWithStudents: FintSchoolWithStudents[], users: (DbAppUser | NewAppUser)[]): { valid: boolean; reason: string } => {
  const user = users.find((user) => user.entra.id === access.entraUserId)
  if (!user) return { valid: false, reason: `User with entra ID ${access.entraUserId} not found` }

  for (const classAccess of access.classes.filter((ca) => ca.type === "AUTOMATISK-KLASSE-TILGANG")) {
    const school = schoolsWithStudents.find((school) => school.skole?.skolenummer.identifikatorverdi === classAccess.schoolNumber)
    if (!school) return { valid: false, reason: `School with school number ${classAccess.schoolNumber} not found` }
    const shouldHaveAccess = school.skole?.elevforhold?.some((ef) => {
      const classToCheck: FintKlassemedlemskap | null | undefined = ef?.klassemedlemskap?.find((km) => km?.klasse.systemId.identifikatorverdi === classAccess.systemId)
      if (!classToCheck) return false
      return classToCheck.klasse.undervisningsforhold?.some((uf) => {
        return uf?.skoleressurs.feidenavn?.identifikatorverdi && uf.skoleressurs.feidenavn.identifikatorverdi === user.feideName
      })
    })
    if (!shouldHaveAccess)
      return {
        valid: false,
        reason: `User with entra ID ${access.entraUserId} (feidenavn ${user.feideName}) should not have access to class ${classAccess.systemId} at school ${classAccess.schoolNumber}`
      }
  }

  for (const groupAccess of access.teachingGroups.filter((ca) => ca.type === "AUTOMATISK-UNDERVISNINGSGRUPPE-TILGANG")) {
    const school = schoolsWithStudents.find((school) => school.skole?.skolenummer.identifikatorverdi === groupAccess.schoolNumber)
    if (!school) return { valid: false, reason: `School with school number ${groupAccess.schoolNumber} not found` }
    const shouldHaveAccess = school.skole?.elevforhold?.some((ef) => {
      const groupToCheck: FintUndervisningsgruppemedlemskap | null | undefined = ef?.undervisningsgruppemedlemskap?.find(
        (km) => km?.undervisningsgruppe?.systemId?.identifikatorverdi === groupAccess.systemId
      )
      if (!groupToCheck) return false
      return groupToCheck.undervisningsgruppe.undervisningsforhold?.some((uf) => {
        return uf?.skoleressurs.feidenavn?.identifikatorverdi && uf.skoleressurs.feidenavn.identifikatorverdi === user.feideName
      })
    })
    if (!shouldHaveAccess)
      return {
        valid: false,
        reason: `User with entra ID ${access.entraUserId} (feidenavn ${user.feideName}) should not have access to group ${groupAccess.systemId} at school ${groupAccess.schoolNumber}`
      }
  }

  for (const groupAccess of access.contactTeacherGroups.filter((ca) => ca.type === "AUTOMATISK-KONTAKTLÆRERGRUPPE-TILGANG")) {
    const school = schoolsWithStudents.find((school) => school.skole?.skolenummer.identifikatorverdi === groupAccess.schoolNumber)
    if (!school) return { valid: false, reason: `School with school number ${groupAccess.schoolNumber} not found` }
    const shouldHaveAccess = school.skole?.elevforhold?.some((ef) => {
      const groupToCheck: FintKontaktlarergruppemedlemskap | null | undefined = ef?.kontaktlarergruppemedlemskap?.find(
        (km) => km?.kontaktlarergruppe.systemId.identifikatorverdi === groupAccess.systemId
      )
      if (!groupToCheck) return false
      return groupToCheck.kontaktlarergruppe.undervisningsforhold?.some((uf) => {
        return uf?.skoleressurs.feidenavn?.identifikatorverdi && uf.skoleressurs.feidenavn.identifikatorverdi === user.feideName
      })
    })
    if (!shouldHaveAccess)
      return {
        valid: false,
        reason: `User with entra ID ${access.entraUserId} (feidenavn ${user.feideName}) should not have access to group ${groupAccess.systemId} at school ${groupAccess.schoolNumber}`
      }
  }
  return { valid: true, reason: "" }
}

const studentIsValid = (student: DbAppStudent, schoolsWithStudents: FintSchoolWithStudents[], updatedSchools: (DbSchool | NewSchool)[]): { valid: boolean; reason: string } => {
  for (const enrollment of student.studentEnrollments.filter((enrollment) => enrollment.source === "AUTO")) {
    const school = schoolsWithStudents.find((s) => s.skole?.skolenummer.identifikatorverdi === enrollment.school.schoolNumber)
    if (!school) return { valid: false, reason: `School with school number ${enrollment.school.schoolNumber} not found` }

    const enrollmentInFint = school.skole?.elevforhold?.find((ef) => ef?.systemId.identifikatorverdi === enrollment.systemId)
    if (!enrollmentInFint) return { valid: false, reason: `Enrollment with system ID ${enrollment.systemId} not found in school ${enrollment.school.schoolNumber}` }
    if (enrollmentInFint.elev.feidenavn?.identifikatorverdi !== student.feideName) return { valid: false, reason: `Enrollment with system ID ${enrollment.systemId} has mismatched feideName` }
    if (enrollmentInFint.elev.person.fodselsnummer.identifikatorverdi !== student.ssn) return { valid: false, reason: `Enrollment with system ID ${enrollment.systemId} has mismatched ssn` }
    if (enrollmentInFint.elev.elevnummer?.identifikatorverdi !== student.studentNumber) {
      return { valid: false, reason: `Enrollment with system ID ${enrollment.systemId} has mismatched student number` }
    }

    const schoolInUpdatedSchools = updatedSchools.find((s) => s.schoolNumber === enrollment.school.schoolNumber)
    if (!schoolInUpdatedSchools) {
      return { valid: false, reason: `School with school number ${enrollment.school.schoolNumber} not found in updated schools, but student-enrollment is active at this school` }
    }
    const allClassesPresent = enrollmentInFint.klassemedlemskap?.every((km) => {
      return enrollment.classMemberships.some((cm) => cm.systemId === km?.systemId.identifikatorverdi)
    })
    if (!allClassesPresent) return { valid: false, reason: `Enrollment with system ID ${enrollment.systemId} is missing class memberships` }
    const allTeachingGroupsPresent = enrollmentInFint.undervisningsgruppemedlemskap?.every((ugm) => {
      return enrollment.teachingGroupMemberships.some((tgm) => tgm.systemId === ugm?.systemId.identifikatorverdi)
    })
    if (!allTeachingGroupsPresent) return { valid: false, reason: `Enrollment with system ID ${enrollment.systemId} is missing teaching group memberships` }
    const allContactTeacherGroupsPresent = enrollmentInFint.kontaktlarergruppemedlemskap?.every((cgm) => {
      return enrollment.contactTeacherGroupMemberships.some((ctgm) => ctgm.systemId === cgm?.systemId.identifikatorverdi)
    })
    if (!allContactTeacherGroupsPresent) return { valid: false, reason: `Enrollment with system ID ${enrollment.systemId} is missing contact teacher group memberships` }
  }

  if (student.mainEnrollment?.source === "AUTO") {
    const mainEnrollmentInFint = schoolsWithStudents
      .find((s) => s.skole?.skolenummer.identifikatorverdi === student.mainEnrollment?.school.schoolNumber)
      ?.skole?.elevforhold?.find((ef) => ef?.systemId.identifikatorverdi === student.mainEnrollment?.systemId)
    if (mainEnrollmentInFint?.hovedskole !== true) return { valid: false, reason: `Main enrollment with system ID ${student.mainEnrollment.systemId} does not have mainSchool true in FINT` }
  }

  return { valid: true, reason: "" }
}

const testEditor: EditorData = {
  by: {
    entraUserId: "test",
    fallbackName: "Test User"
  },
  at: new Date()
}

describe("repackPeriode", () => {
  it("should return correct start date for periode with no end date", () => {
    const periode: FintGyldighetsPeriode = { start: "2020-01-01" }
    const repacked = repackPeriode(periode)
    assert(repacked.start?.getTime() === new Date(periode.start).getTime(), `Expected start date ${periode.start}, got ${repacked.start}`)
  })

  it("should return correct start and end date for periode with end date", () => {
    const periode: FintGyldighetsPeriode = { start: "2020-01-01", slutt: "2020-12-31" }
    const repacked = repackPeriode(periode)
    assert(repacked.start?.getTime() === new Date(periode.start).getTime(), `Expected start date ${periode.start}, got ${repacked.start}`)
    assert(repacked.end?.getTime() === new Date("2020-12-31T23:59:59.999Z").getTime(), `Expected end date ${periode.slutt}, got ${repacked.end}`)
  })

  it("should return start and end null for missing periode", () => {
    const repacked = repackPeriode(undefined)
    assert(repacked.start === null, `Expected start date to be null, got ${repacked.start}`)
    assert(repacked.end === null, `Expected end date to be null, got ${repacked.end}`)
    const repacked2 = repackPeriode(null)
    assert(repacked2.start === null, `Expected start date to be null, got ${repacked2.start}`)
    assert(repacked2.end === null, `Expected end date to be null, got ${repacked2.end}`)
  })

  it("should convert start dates to start at 00:00:00 and end dates to end at 23:59:59", () => {
    const periode: FintGyldighetsPeriode = { start: "2020-01-01T12:34:56", slutt: "2020-12-31T23:45:01" }
    const repacked = repackPeriode(periode)
    assert(repacked.start?.getTime() === new Date("2020-01-01T00:00:00.000Z").getTime(), `Expected start date to be 2020-01-01T00:00:00, got ${repacked.start}`)
    assert(repacked.end?.getTime() === new Date("2020-12-31T23:59:59.999Z").getTime(), `Expected end date to be 2020-12-31T23:59:59, got ${repacked.end}`)
  })
})

describe("sync-db-data/users-students-and-access", () => {
  const mockConfig: GenerateMockFintSchoolsWithStudentsOptions = {
    numberOfKlasser: 5,
    numberOfKontaktlarergrupper: 5,
    numberOfUndervisningsgrupper: 5,
    numberOfTeachers: 5,
    numberOfStudents: 10,
    schoolNames: ["School 1", "School 2"]
  }
  const mockSchools: FintSchoolWithStudents[] = generateMockFintSchoolsWithStudents(mockConfig)

  writeFileSync("./tests/sync-db-data/mock-fint-schools.json", JSON.stringify(mockSchools, null, 2))

  describe("data is mapped correctly when only given mockSchools", () => {
    const result = updateUsersStudentsAndAccess([], [], [], [], mockSchools, [])

    it("should create students without duplicates", () => {
      // find duplicate students
      const studentIds = result.updatedStudents.map((s) => s.feideName)
      const uniqueStudentIds = new Set(studentIds)
      assert(studentIds.length === uniqueStudentIds.size, `Expected no duplicate students, but ${studentIds.length - uniqueStudentIds.size} duplicates found`)
    })
    it("should only return valid auto access entries", () => {
      for (const access of result.updatedAccess) {
        const validation = isValidAutoAccess(access, mockSchools, result.updatedAppUsers)
        assert(validation.valid, `Access validation failed: ${validation.reason}`)
      }
    })
    it("should create valid students", () => {
      for (const student of result.updatedStudents) {
        const validation = studentIsValid(student as DbAppStudent, mockSchools, result.updatedSchools)
        assert(validation.valid, `Student validation failed: ${validation.reason}`)
      }
    })
  })

  describe("data is mapped and updated correctly when previous data is present", async () => {
    const existingUserIdThatShouldBeInactive = new ObjectId()
    const currentUsers: DbAppUser[] = [
      {
        _id: existingUserIdThatShouldBeInactive,
        active: true,
        entra: {
          id: "existing-user-id",
          companyName: "Existing Company",
          department: "Existing Department",
          displayName: "Existing User",
          userPrincipalName: "existing.user@company.com"
        },
        feideName: "existing.feidenavn",
        created: testEditor,
        modified: testEditor,
        source: "AUTO"
      }
    ]

    const getRandomElev = (exclude: FintElev[]): { elev: FintElev; elevforhold: FintElevforhold; skole: SchoolInfo } => {
      let elev: FintElev | undefined
      let elevforhold: FintElevforhold
      let skole: SchoolInfo
      const maxAttempts = 100
      let attempts = 0
      while (
        elev === undefined ||
        exclude.some(
          (e) =>
            e.systemId.identifikatorverdi === elev?.systemId.identifikatorverdi ||
            e.person.fodselsnummer.identifikatorverdi === elev?.person.fodselsnummer.identifikatorverdi ||
            e.feidenavn?.identifikatorverdi === elev?.feidenavn?.identifikatorverdi
        )
      ) {
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to find a unique elev after maximum attempts (${maxAttempts})`)
        }
        const schoolIndex = Math.floor(Math.random() * mockSchools.length)
        const school = mockSchools[schoolIndex]
        const elevforholdIndex = Math.floor(Math.random() * (school.skole?.elevforhold?.length || 0))
        const enrollment = school.skole?.elevforhold?.[elevforholdIndex]
        elev = school.skole?.elevforhold?.[elevforholdIndex]?.elev
        if (elev && enrollment && school.skole) {
          skole = {
            schoolNumber: school.skole.skolenummer.identifikatorverdi,
            name: school.skole.navn
          }
          elevforhold = enrollment
        } else {
          elev = undefined
        }
        attempts++
      }
      // @ts-expect-error - we check this in the while loop
      return { elev, elevforhold, skole }
    }

    const manualStudentSuddenlyInFint = getRandomElev([])
    if (!manualStudentSuddenlyInFint) throw new Error("Mock data generation failed, manualStudentSuddenlyInFint not found")
    // ManualStudentSuddenlyInFint har et aktivt elevforhold, lager et manuelt elevforhold på samme skole som vi definerer nedenfor, for å teste at det manuelle elevforholdet blir satt til inaktivt.

    const studentNameUpdate = getRandomElev([manualStudentSuddenlyInFint.elev]).elev
    if (!studentNameUpdate) throw new Error("Mock data generation failed, no students found")
    const studentSsnUpdate = getRandomElev([studentNameUpdate]).elev
    if (!studentSsnUpdate) throw new Error("Mock data generation failed, studentSsnUpdate not found")
    const studentSystemIdUpdate = getRandomElev([studentNameUpdate, studentSsnUpdate]).elev
    if (!studentSystemIdUpdate) throw new Error("Mock data generation failed, studentSystemIdUpdate not found")
    const studentWithManualEnrollment = getRandomElev([studentNameUpdate, studentSsnUpdate, studentSystemIdUpdate])
    if (!studentWithManualEnrollment) throw new Error("Mock data generation failed, studentWithManualEnrollment not found")
    studentWithManualEnrollment.elevforhold.hovedskole = true // To test that manual enrollment get set to mainschool false

    const baseCurrentStudent: DbAppStudent = {
      _id: new ObjectId(),
      feideName: "whatever",
      name: "Et navn",
      ssn: "12345678910",
      created: testEditor,
      modified: testEditor,
      source: "AUTO",
      studentEnrollments: [],
      mainEnrollment: null,
      studentNumber: "S12345",
      systemId: "noe"
    }

    const currentStudents: DbAppStudent[] = [
      {
        ...baseCurrentStudent,
        _id: new ObjectId(),
        feideName: "manuell løk",
        systemId: "manuell-løk-id",
        ssn: manualStudentSuddenlyInFint.elev.person.fodselsnummer.identifikatorverdi,
        source: "MANUAL", // TODO oppdateres denne da? Skal vi oppdatere den i det hele tatt? Ja, hvis den dukker opp i FINT, er den ikke MANUAL lenger, og da bør source oppdateres.
        studentEnrollments: [
          {
            school: {
              schoolNumber: manualStudentSuddenlyInFint.skole.schoolNumber,
              name: manualStudentSuddenlyInFint.skole.name
            },
            classMemberships: [
              {
                systemId: "et-klassemedlemskap-som-skal-bli-inaktivt",
                period: { start: new Date("2020-01-01T00:00:00"), end: null },
                classGroup: {
                  systemId: "en-klasse-som-skal-bli-inaktivt",
                  name: "En klasse som skal bli inaktiv",
                  source: "MANUAL",
                  teachers: []
                }
              }
            ],
            contactTeacherGroupMemberships: [],
            teachingGroupMemberships: [],
            mainSchool: true,
            period: { start: new Date("2020-01-01T00:00:00"), end: null },
            systemId: "manual-elevforhold-som-skal-bli-inaktivt",
            source: "MANUAL"
          }
        ]
      },
      {
        ...baseCurrentStudent,
        _id: new ObjectId(),
        name: "Et navn som skal oppdateres",
        ssn: studentNameUpdate.person.fodselsnummer.identifikatorverdi,
        source: "AUTO",
        studentEnrollments: [
          {
            school: {
              schoolNumber: "69",
              name: "En skole som ikke skal brukes"
            },
            systemId: "elevforhold-som-skal-fjernes",
            classMemberships: [],
            teachingGroupMemberships: [],
            contactTeacherGroupMemberships: [],
            mainSchool: true,
            period: { start: new Date("2020-01-01T00:00:00"), end: null },
            source: "AUTO"
          }
        ],
        systemId: studentNameUpdate.systemId.identifikatorverdi
      },
      {
        ...baseCurrentStudent,
        _id: new ObjectId(),
        ssn: "oppdater meg",
        source: "AUTO",
        systemId: studentSsnUpdate.systemId.identifikatorverdi
      },
      {
        ...baseCurrentStudent,
        _id: new ObjectId(),
        ssn: studentSystemIdUpdate.person.fodselsnummer.identifikatorverdi,
        source: "AUTO",
        studentNumber: "S12345",
        systemId: "oppdater-meg"
      },
      {
        ...baseCurrentStudent,
        _id: new ObjectId(),
        feideName: "jeg-finnes-ikke-i-fint-lenger",
        name: "Et navn som ikke skal oppdateres",
        ssn: "12345678911finnesforhåpentligvis-ikke",
        source: "AUTO",
        systemId: "jeg-finnes-ikke-i-fint-lenger"
      },
      {
        ...baseCurrentStudent,
        _id: new ObjectId(),
        feideName: studentWithManualEnrollment.elev.feidenavn?.identifikatorverdi || "manual.student",
        systemId: studentWithManualEnrollment.elev.systemId.identifikatorverdi,
        ssn: studentWithManualEnrollment.elev.person.fodselsnummer.identifikatorverdi,
        source: "AUTO",
        studentEnrollments: [
          {
            school: {
              schoolNumber: "420-super-manuell",
              name: "En skole"
            },
            classMemberships: [
              {
                systemId: "et-klassemedlemskap-som-skal-bestå",
                period: { start: new Date("2020-01-01T00:00:00"), end: null },
                classGroup: {
                  systemId: "en-klasse-som-skal-bestå",
                  name: "En klasse som skal bestå",
                  source: "MANUAL",
                  teachers: []
                }
              }
            ],
            contactTeacherGroupMemberships: [],
            teachingGroupMemberships: [],
            mainSchool: true,
            period: { start: new Date("2020-01-01T00:00:00"), end: null },
            systemId: "manual-elevforhold",
            source: "MANUAL"
          }
        ]
      }
    ]

    const existingAccessId = new ObjectId()
    const currentAccess: DbAccess[] = [
      {
        _id: existingAccessId,
        entraUserId: currentUsers[0].entra.id,
        name: "Eksisterende bruker",
        programAreas: [
          {
            type: "MANUELL-UNDERVISNINGSOMRÅDE-TILGANG",
            _id: "jeg-skal-ikke-bli-borte",
            schoolNumber: "69",
            granted: testEditor,
            source: "MANUAL"
          }
        ],
        schools: [],
        students: [],
        classes: [
          {
            type: "AUTOMATISK-KLASSE-TILGANG",
            systemId: "jeg-skal-bli-borte",
            schoolNumber: "69",
            granted: testEditor,
            source: "AUTO"
          }
        ],
        teachingGroups: [
          {
            type: "AUTOMATISK-UNDERVISNINGSGRUPPE-TILGANG",
            systemId: "jeg-skal-bli-borte",
            schoolNumber: "69",
            granted: testEditor,
            source: "AUTO"
          }
        ],
        contactTeacherGroups: [
          {
            type: "AUTOMATISK-KONTAKTLÆRERGRUPPE-TILGANG",
            systemId: "jeg-skal-bli-borte",
            schoolNumber: "69",
            granted: testEditor,
            source: "AUTO"
          }
        ]
      }
    ]

    const tullVgsId = new ObjectId()
    const currentSchools: DbSchool[] = [
      {
        _id: tullVgsId,
        name: "Tull vgs",
        schoolNumber: "42",
        created: testEditor,
        modified: testEditor,
        source: "MANUAL"
      }
    ]

    const mockEntraClient = getEntraClient()
    const mockEntraUsers = await mockEntraClient.getEnterpriseApplicationUsers()

    const result = updateUsersStudentsAndAccess(currentUsers, currentStudents, currentAccess, currentSchools, mockSchools, mockEntraUsers)
    writeFileSync("./tests/sync-db-data/synced-users-students-and-access.json", JSON.stringify(result, null, 2))

    it("should create students without duplicates", () => {
      // find duplicate students
      const studentIds = result.updatedStudents.map((s) => s.feideName)
      const uniqueStudentIds = new Set(studentIds)
      assert(studentIds.length === uniqueStudentIds.size, `Expected no duplicate students, but ${studentIds.length - uniqueStudentIds.size} duplicates found`)
    })

    it("should only return valid auto access entries", () => {
      for (const access of result.updatedAccess) {
        const validation = isValidAutoAccess(access, mockSchools, result.updatedAppUsers)
        assert(validation.valid, `Access validation failed: ${validation.reason}`)
      }
    })

    it("should preserve manual enrollments and set them to inactive when student suddenly appears in FINT with active enrollment at the same school", () => {
      const updatedStudent = result.updatedStudents.find((s) => s.systemId === manualStudentSuddenlyInFint.elev.systemId.identifikatorverdi)
      assert(updatedStudent, "Updated student not found")
      const manualEnrollment = updatedStudent.studentEnrollments.find((enrollment) => enrollment.systemId === "manual-elevforhold-som-skal-bli-inaktivt")
      assert(manualEnrollment, "Manual enrollment not found")
      assert(manualEnrollment.period.end !== null, "Expected manual enrollment to have an end date after being set to inactive")
      assert(manualEnrollment.period.end && manualEnrollment.period.end < new Date(), `Expected manual enrollment to be set to inactive, got end=${manualEnrollment.period.end}`)
      assert(manualEnrollment.classMemberships.length === 1, `Expected manual enrollment to still have class memberships, got ${manualEnrollment.classMemberships.length}`)
      assert(manualEnrollment.mainSchool === false, `Expected manual enrollment mainSchool to be set to false, got ${manualEnrollment.mainSchool}`)
      assert(updatedStudent.source === "AUTO", `Expected student source to be updated to AUTO, got ${updatedStudent.source}`)
    })

    it("should update existing student name and student number correctly", () => {
      const updatedStudent = result.updatedStudents.find((s) => s.systemId === studentNameUpdate.systemId.identifikatorverdi)
      assert(updatedStudent, "Updated student not found")
      assert(!updatedStudent.studentEnrollments.find((enrollment) => enrollment.systemId === "elevforhold-som-skal-fjernes"), "Expected old enrollment to be removed")
      assert(
        updatedStudent.name !== "Et navn som skal oppdateres",
        `Expected student name to be updated, got "${updatedStudent.name}" but should have been "${studentNameUpdate.person.navn.fornavn} ${studentNameUpdate.person.navn.etternavn}"`
      )
      assert(
        updatedStudent.studentNumber === studentNameUpdate.elevnummer?.identifikatorverdi,
        `Expected student number to be updated, got "${updatedStudent.studentNumber}" but should have been "${studentNameUpdate.elevnummer?.identifikatorverdi}"`
      )
    })

    it("should update existing student ssn correctly", () => {
      const updatedStudent = result.updatedStudents.find((s) => s.systemId === studentSsnUpdate.systemId.identifikatorverdi)
      assert(updatedStudent, "Updated student not found")
      assert(
        updatedStudent.ssn === studentSsnUpdate.person.fodselsnummer.identifikatorverdi,
        `Expected student ssn to be updated, got "${updatedStudent.ssn}" but should have been "${studentSsnUpdate.person.fodselsnummer.identifikatorverdi}"`
      )
    })

    it("should update existing student systemId correctly", () => {
      const updatedStudent = result.updatedStudents.find((s) => s.ssn === studentSystemIdUpdate.person.fodselsnummer.identifikatorverdi)
      assert(updatedStudent, "Updated student not found")
      assert(
        updatedStudent.systemId === studentSystemIdUpdate.systemId.identifikatorverdi,
        `Expected student systemId to be updated, got "${updatedStudent.systemId}" but should have been "${studentSystemIdUpdate.systemId.identifikatorverdi}"`
      )
    })

    it("should remove auto enrollments when student is no longer in FINT", () => {
      const deactivatedStudent = result.updatedStudents.find((s) => s.systemId === "jeg-finnes-ikke-i-fint-lenger")
      assert(deactivatedStudent, "Deactivated student not found")
      assert(deactivatedStudent.name === "Et navn som ikke skal oppdateres", `Expected student name to be unchanged, got "${deactivatedStudent.name}"`)
      assert(!deactivatedStudent.studentEnrollments.find((enrollment) => enrollment.systemId === "elevforhold-som-skal-fjernes-2"), "Expected enrollment to be removed")
    })

    it("should preserve manual enrollments and related access when student is still in FINT", () => {
      const student = result.updatedStudents.find((s) => s.feideName === studentWithManualEnrollment.elev.feidenavn?.identifikatorverdi)
      assert(student, "Student with manual enrollment not found")
      const manualEnrollment = student.studentEnrollments.find((enrollment) => enrollment.systemId === "manual-elevforhold")
      assert(manualEnrollment, "Expected manual enrollment to be preserved")
      assert(manualEnrollment.classMemberships.length === 1, "Expected class memberships of manual enrollment to be preserved")
      assert(manualEnrollment.mainSchool === false, "Expected mainSchool of manual enrollment to be set to false, but got true")
    })

    it("should update existing access correctly", () => {
      const updatedAccess = result.updatedAccess.find((a) => (a as DbAccess)._id.toString() === existingAccessId.toString())
      assert(updatedAccess, "Updated access not found")
      assert(
        updatedAccess.programAreas.find((c) => c.type === "MANUELL-UNDERVISNINGSOMRÅDE-TILGANG" && c._id === "jeg-skal-ikke-bli-borte"),
        "Expected manual programArea access to be preserved"
      )
      assert(!updatedAccess.classes.find((c) => c.type === "AUTOMATISK-KLASSE-TILGANG" && c.systemId === "jeg-skal-bli-borte"), "Expected old automatic class access to be removed")
      assert(
        !updatedAccess.teachingGroups.find((c) => c.type === "AUTOMATISK-UNDERVISNINGSGRUPPE-TILGANG" && c.systemId === "jeg-skal-bli-borte"),
        "Expected old automatic teaching group access to be removed"
      )
      assert(
        !updatedAccess.contactTeacherGroups.find((c) => c.type === "AUTOMATISK-KONTAKTLÆRERGRUPPE-TILGANG" && c.systemId === "jeg-skal-bli-borte"),
        "Expected old automatic contact teacher group access to be removed"
      )
    })

    it("should create valid students", () => {
      for (const student of result.updatedStudents) {
        const validation = studentIsValid(student as DbAppStudent, mockSchools, result.updatedSchools)
        assert(validation.valid, `Student validation failed: ${validation.reason}`)
      }
    })

    it("should preserve previous schools when updating", () => {
      const preservedSchool = result.updatedSchools.find((s) => s.schoolNumber === "42" && "_id" in s && s._id.toString() === tullVgsId.toString())
      assert(preservedSchool, "Expected to find preserved school, but not found")
    })

    it("Should set active to false for users that are no longer active in Entra", () => {
      const inactiveUser: DbAppUser | NewAppUser | undefined = result.updatedAppUsers.find((user) => {
        return "_id" in user && user._id.toString() === existingUserIdThatShouldBeInactive.toString()
      })
      assert(inactiveUser, "Inactive user not found")
      assert(inactiveUser.active === false, `Expected user to be inactive, got active=${inactiveUser.active}`)
    })

    it("Should link existing Entra users to MOCK FINT teachers, and set feidename for AppUser based on linked teacher", async () => {
      for (const entraUser of mockEntraUsers) {
        const user = result.updatedAppUsers.find((appUser) => appUser.entra.id === entraUser.id)
        assert(user, `Expected to find user with Entra ID ${entraUser.id}, but not found`)
        assert(user.active === true, `Expected user with Entra ID ${entraUser.id} to be active, got active=${user.active}`)
        assert(
          entraUser.onPremisesSamAccountName && !user.feideName.startsWith(entraUser.onPremisesSamAccountName),
          `Expected feideName for user with Entra ID ${entraUser.id} to be updated with a random MOCK-teachers feidenavn, got feideName=${user.feideName} and onPremisesSamAccountName=${entraUser.onPremisesSamAccountName}`
        )
      }
    })
  })
})
