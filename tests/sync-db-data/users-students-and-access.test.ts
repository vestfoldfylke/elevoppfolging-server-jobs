import assert from "node:assert";
import { describe, it } from "node:test";
import { repackPeriode, updateUsersStudentsAndAccess } from "../../src/lib/sync-db-data/users-students-and-access";
import { generateMockFintSchoolsWithStudents } from "../../src/lib/fint/generate-fint-mock-data";
import { GenerateMockFintSchoolsWithStudentsOptions } from "../../src/types/fint/fint-mock";
import { FintKlassemedlemskap, FintKontaktlarergruppemedlemskap, FintSchoolWithStudents, FintUndervisningsgruppemedlemskap } from "../../src/types/fint/fint-school-with-students";
import { Access, AppStudent, AppUser, NewAccess, NewAppUser } from "../../src/types/db";
import { writeFileSync } from "node:fs";

const isValidAutoAccess = (access: Access | NewAccess, schoolsWithStudents: FintSchoolWithStudents[], users: (AppUser | NewAppUser)[]): { valid: boolean, reason: string } => {
  const user = users.find(user => user.entra.id === access.entraUserId);
  if (!user) return { valid: false, reason: `User with entra ID ${access.entraUserId} not found` };

  for (const classAccess of access.classes.filter(ca => ca.type === "AUTOMATISK-KLASSE-TILGANG")) {
    const school = schoolsWithStudents.find(school => school.skole?.skolenummer.identifikatorverdi === classAccess.schoolNumber);
    if (!school) return { valid: false, reason: `School with school number ${classAccess.schoolNumber} not found` };
    const shouldHaveAccess = school.skole.elevforhold.some(ef => {
      const classToCheck: FintKlassemedlemskap = ef.klassemedlemskap.find(km => km.klasse.systemId.identifikatorverdi === classAccess.systemId)
      if (!classToCheck) return false;
      if (!repackPeriode(ef.gyldighetsperiode).active) return false
      if (!repackPeriode(classToCheck.gyldighetsperiode).active) return false
      return classToCheck.klasse.undervisningsforhold.some(uf => {
        return uf.skoleressurs.feidenavn.identifikatorverdi.length > 0 && uf.skoleressurs.feidenavn.identifikatorverdi === user.feidenavn
      })
    })
    if (!shouldHaveAccess) return { valid: false, reason: `User with entra ID ${access.entraUserId} (feidenavn ${user.feidenavn}) should not have access to class ${classAccess.systemId} at school ${classAccess.schoolNumber}` };
  }

  for (const groupAccess of access.teachingGroups.filter(ca => ca.type === "AUTOMATISK-UNDERVISNINGSGRUPPE-TILGANG")) {
    const school = schoolsWithStudents.find(school => school.skole?.skolenummer.identifikatorverdi === groupAccess.schoolNumber);
    if (!school) return { valid: false, reason: `School with school number ${groupAccess.schoolNumber} not found` };
    const shouldHaveAccess = school.skole.elevforhold.some(ef => {
      const groupToCheck: FintUndervisningsgruppemedlemskap = ef.undervisningsgruppemedlemskap.find(km => km.undervisningsgruppe.systemId.identifikatorverdi === groupAccess.systemId);
      if (!groupToCheck) return false;
      if (!repackPeriode(ef.gyldighetsperiode).active) return false
      if (!repackPeriode(groupToCheck.gyldighetsperiode).active) return false
      return groupToCheck.undervisningsgruppe.undervisningsforhold.some(uf => {
        return uf.skoleressurs.feidenavn.identifikatorverdi.length > 0 && uf.skoleressurs.feidenavn.identifikatorverdi === user.feidenavn
      })
    })
    if (!shouldHaveAccess) return { valid: false, reason: `User with entra ID ${access.entraUserId} (feidenavn ${user.feidenavn}) should not have access to group ${groupAccess.systemId} at school ${groupAccess.schoolNumber}` };
  }

  for (const groupAccess of access.contactTeacherGroups.filter(ca => ca.type === "AUTOMATISK-KONTAKTLÆRERGRUPPE-TILGANG")) {
    const school = schoolsWithStudents.find(school => school.skole?.skolenummer.identifikatorverdi === groupAccess.schoolNumber);
    if (!school) return { valid: false, reason: `School with school number ${groupAccess.schoolNumber} not found` };
    const shouldHaveAccess = school.skole.elevforhold.some(ef => {
      const groupToCheck: FintKontaktlarergruppemedlemskap = ef.kontaktlarergruppemedlemskap.find(km => km.kontaktlarergruppe.systemId.identifikatorverdi === groupAccess.systemId);
      if (!groupToCheck) return false;
      if (!repackPeriode(ef.gyldighetsperiode).active) return false
      if (!repackPeriode(groupToCheck.gyldighetsperiode).active) return false
      return groupToCheck.kontaktlarergruppe.undervisningsforhold.some(uf => {
        return uf.skoleressurs.feidenavn.identifikatorverdi.length > 0 && uf.skoleressurs.feidenavn.identifikatorverdi === user.feidenavn
      })
    })
    if (!shouldHaveAccess) return { valid: false, reason: `User with entra ID ${access.entraUserId} (feidenavn ${user.feidenavn}) should not have access to group ${groupAccess.systemId} at school ${groupAccess.schoolNumber}` };
  }
  return { valid: true, reason: "" };
}

describe("repackPeriode", () => {
  it("should return active true for periode with no end date", () => {
    const periode = { start: "2020-01-01" };
    const repacked = repackPeriode(periode);
    assert(repacked.active === true, `Expected active true, got ${repacked.active}`);
  });

  it("should return active false for periode with end date in the past", () => {
    const periode = { start: "2020-01-01", slutt: "2020-12-31" };
    const repacked = repackPeriode(periode);
    assert(repacked.active === false, `Expected active false, got ${repacked.active}`);
  });

  it("should return active false for periode with start date in the future", () => {
    const periode = { start: "2999-01-01" };
    const repacked = repackPeriode(periode);
    assert(repacked.active === false, `Expected active false, got ${repacked.active}`);
  });

  it("should return active false for periode when periode is null", () => {
    const repacked = repackPeriode(null);
    assert(repacked.active === false, `Expected active false, got ${repacked.active}`);
  });

  it("should return active false for periode when periode is undefined", () => {
    const repacked = repackPeriode(undefined);
    assert(repacked.active === false, `Expected active false, got ${repacked.active}`);
  });

  it("should return active false when start is not a valid date", () => {
    const periode = { start: "not-a-date-string" };
    const repacked = repackPeriode(periode);
    assert(repacked.active === false, `Expected active false, got ${repacked.active}`);
  });

  it("should return active false when slutt is not a valid date", () => {
    const periode = { start: "2022-01-01", slutt: "not-a-date-string" };
    const repacked = repackPeriode(periode);
    assert(repacked.active === false, `Expected active false, got ${repacked.active}`);
  });


  it("should return active false when end is before start", () => {
    const periode = { start: "2022-01-01", slutt: "2021-01-01" };
    const repacked = repackPeriode(periode);
    assert(repacked.active === false, `Expected active false, got ${repacked.active}`);
  })
});

describe("sync-db-data/users-students-and-access", () => {
  const mockConfig: GenerateMockFintSchoolsWithStudentsOptions = {
    numberOfKlasser: 5,
    numberOfKontaktlarergrupper: 5,
    numberOfUndervisningsgrupper: 5,
    numberOfUndervisningsforhold: 5,
    numberOfStudents: 10,
    schoolNames: ["School 1", "School 2"]
  }
  const mockSchools: FintSchoolWithStudents[] = generateMockFintSchoolsWithStudents(mockConfig);

  writeFileSync("./tests/sync-db-data/mock-fint-schools.json", JSON.stringify(mockSchools, null, 2));

  describe("data is mapped correctly when only given mockSchools", () => {
    const result = updateUsersStudentsAndAccess([], [], [], mockSchools);
    
    it("should create correct number of students without duplicates", () => {
      assert(result.updatedStudents.length === mockConfig.numberOfStudents, `Expected ${mockConfig.numberOfStudents} students, got ${result.updatedStudents.length}`);
      // find duplicate students
      const studentIds = result.updatedStudents.map(s => s.feideName);
      const uniqueStudentIds = new Set(studentIds);
      assert(studentIds.length === uniqueStudentIds.size, `Expected no duplicate students, but ${studentIds.length - uniqueStudentIds.size} duplicates found`);
    });
    it("should only return valid auto access entries", () => {
      for (const access of result.updatedAccess) {
        const validation = isValidAutoAccess(access, mockSchools, result.updatedAppUsers);
        assert(validation.valid, `Access validation failed: ${validation.reason}`)
      }
    }) 
  })

  describe("data is mapped and updated correctly when previous data is present", () => {  
    const currentUsers: AppUser[] = [
      {
        _id: "existing-user-id",
        entra: {
          id: "existing-user-id",
          companyName: "Existing Company",
          department: "Existing Department",
          displayName: "Existing User",
          userPrincipalName: "existing.user@company.com"
        },
        feidenavn: "existing.feidenavn"
      }
    ]
    
    const studentNameUpdate = mockSchools[0].skole.elevforhold[0].elev
    const studentSsnUpdate = mockSchools[0].skole.elevforhold[1]?.elev || mockSchools[1].skole.elevforhold[0].elev
    const studentSystemIdUpdate = mockSchools[0].skole.elevforhold[2]?.elev || mockSchools[1].skole.elevforhold[1].elev
    const currentStudents: AppStudent[] = [
      {
        _id: "student-to-update-name-and-elevnummer",
        feideName: studentNameUpdate.feidenavn.identifikatorverdi,
        active: false,
        name: "Et navn som skal oppdateres",
        lastSynced: "samma driten",
        ssn: studentNameUpdate.person.fodselsnummer.identifikatorverdi,
        studentEnrollments: [
          { 
            school: {
              _id: "nope",
              schoolNumber: "69",
              name: "En skole som ikke skal brukes"
            },
            systemId: "elevforhold-som-skal-fjernes",
            classMemberships: [],
            teachingGroupMemberships: [],
            contactTeacherGroupMemberships: [],
            mainSchool: true,
            period: { start: "2020-01-01", end: null, active: true }
          }
        ],
        studentNumber: "S12345",
        systemId: studentNameUpdate.systemId.identifikatorverdi
      },
      {
        _id: "student-to-update-ssn",
        feideName: studentSsnUpdate.feidenavn.identifikatorverdi,
        active: false,
        name: "Et navn som skal oppdateres",
        lastSynced: "samma driten",
        ssn: "oppdater meg",
        studentEnrollments: [
          { 
            school: {
              _id: "nope",
              schoolNumber: "69",
              name: "En skole som ikke skal brukes"
            },
            systemId: "elevforhold-som-skal-fjernes",
            classMemberships: [],
            teachingGroupMemberships: [],
            contactTeacherGroupMemberships: [],
            mainSchool: true,
            period: { start: "2020-01-01", end: null, active: true }
          }
        ],
        studentNumber: "S12345",
        systemId: studentSsnUpdate.systemId.identifikatorverdi
      },
      {
        _id: "student-to-update-systemID",
        feideName: studentSystemIdUpdate.feidenavn.identifikatorverdi,
        active: false,
        name: "Et navn som skal oppdateres",
        lastSynced: "samma driten",
        ssn: studentSystemIdUpdate.person.fodselsnummer.identifikatorverdi,
        studentEnrollments: [
          { 
            school: {
              _id: "nope",
              schoolNumber: "69",
              name: "En skole som ikke skal brukes"
            },
            systemId: "elevforhold-som-skal-fjernes",
            classMemberships: [],
            teachingGroupMemberships: [],
            contactTeacherGroupMemberships: [],
            mainSchool: true,
            period: { start: "2020-01-01", end: null, active: true }
          }
        ],
        studentNumber: "S12345",
        systemId: "oppdater-meg"
      },
      {
        _id: "student-not-longer-in-fint",
        feideName: "jeg-finnes-ikke-i-fint-lenger",
        active: true,
        name: "Et navn som ikke skal oppdateres",
        lastSynced: "samma driten",
        ssn: "12345678911",
        studentEnrollments: [
          {
            systemId: "elevforhold-som-skal-fjernes-2",
            school: {
              _id: "nope",
              schoolNumber: "69",
              name: "En skole som ikke skal brukes"
            },
            classMemberships: [],
            teachingGroupMemberships: [],
            contactTeacherGroupMemberships: [],
            mainSchool: true,
            period: { start: "2020-01-01", end: null, active: true }
          }
        ],
        studentNumber: "S12345",
        systemId: "jeg-finnes-ikke-i-fint-lenger"
      }
    ]
    
    const currentAccess: Access[] = [
      {
        _id: "existing-access-id",
        entraUserId: currentUsers[0].entra.id,
        name: "Eksisterende bruker",
        programAreas: [],
        schools: [],
        students: [],
        classes: [
          {
            type: "AUTOMATISK-KLASSE-TILGANG",
            systemId: "jeg-skal-bli-borte",
            schoolNumber: "69",
            granted: {
              at: "samma driten",
              by: {
                _id: "SYSTEM",
                name: "SYNC JOB"
              }
            }
          },
          {
            type: "MANUELL-KLASSE-TILGANG",
            systemId: "jeg-skal-ikke-bli-borte",
            schoolNumber: "69",
            granted: {
              at: "samma driten",
              by: {
                _id: "some-admin-id",
                name: "Some Admin"
              }
            }
          }
        ],
        teachingGroups: [
          {
            type: "AUTOMATISK-UNDERVISNINGSGRUPPE-TILGANG",
            systemId: "jeg-skal-bli-borte",
            schoolNumber: "69",
            granted: {
              at: "samma driten",
              by: {
                _id: "SYSTEM",
                name: "SYNC JOB"
              }
            }
          }
        ],
        contactTeacherGroups: [
          {
            type: "AUTOMATISK-KONTAKTLÆRERGRUPPE-TILGANG",
            systemId: "jeg-skal-bli-borte",
            schoolNumber: "69",
            granted: {
              at: "samma driten",
              by: {
                _id: "SYSTEM",
                name: "SYNC JOB"
              }
            }
          }
        ]
      }
    ]

    const result = updateUsersStudentsAndAccess(currentUsers, currentStudents, currentAccess, mockSchools);
    
    it("should create correct number of students without duplicates", () => {
      assert(result.updatedStudents.length === mockConfig.numberOfStudents + 1, `Expected ${mockConfig.numberOfStudents + 1} students, got ${result.updatedStudents.length}`);
      // find duplicate students
      const studentIds = result.updatedStudents.map(s => s.feideName);
      const uniqueStudentIds = new Set(studentIds);
      assert(studentIds.length === uniqueStudentIds.size, `Expected no duplicate students, but ${studentIds.length - uniqueStudentIds.size} duplicates found`);
    });

    it("should only return valid auto access entries", () => {
      for (const access of result.updatedAccess) {
        const validation = isValidAutoAccess(access, mockSchools, result.updatedAppUsers);
        assert(validation.valid, `Access validation failed: ${validation.reason}`)
      }
    })

    it("should update existing student name and student number correctly", () => {
      const updatedStudent = result.updatedStudents.find(s => (s as AppStudent)._id === "student-to-update-name-and-elevnummer");
      assert(updatedStudent, "Updated student not found");
      assert(updatedStudent.active === true, `Expected student to be active, got ${updatedStudent.active}`);
      assert(!updatedStudent.studentEnrollments.find(enrollment => enrollment.systemId === "elevforhold-som-skal-fjernes"), "Expected old enrollment to be removed");
      assert(updatedStudent.name !== "Et navn som skal oppdateres", `Expected student name to be updated, got "${updatedStudent.name}" but should have been "${studentNameUpdate.person.navn.fornavn} ${studentNameUpdate.person.navn.etternavn}"`);
      assert(updatedStudent.studentNumber === studentNameUpdate.elevnummer.identifikatorverdi, `Expected student number to be updated, got "${updatedStudent.studentNumber}" but should have been "${studentNameUpdate.elevnummer.identifikatorverdi}"`);
    })

    it("should update existing student ssn correctly", () => {
      const updatedStudent = result.updatedStudents.find(s => (s as AppStudent)._id === "student-to-update-ssn");
      assert(updatedStudent, "Updated student not found");
      assert(updatedStudent.ssn === studentSsnUpdate.person.fodselsnummer.identifikatorverdi, `Expected student ssn to be updated, got "${updatedStudent.ssn}" but should have been "${studentSsnUpdate.person.fodselsnummer.identifikatorverdi}"`);
    })

    it("should update existing student systemId correctly", () => {
      const updatedStudent = result.updatedStudents.find(s => (s as AppStudent)._id === "student-to-update-systemID");
      assert(updatedStudent, "Updated student not found");
      assert(updatedStudent.systemId === studentSystemIdUpdate.systemId.identifikatorverdi, `Expected student systemId to be updated, got "${updatedStudent.systemId}" but should have been "${studentSystemIdUpdate.systemId.identifikatorverdi}"`);
    })

    it("should deactivate students and remove enrollments when student is no longer in FINT", () => {
      const deactivatedStudent = result.updatedStudents.find(s => (s as AppStudent)._id === "student-not-longer-in-fint");
      assert(deactivatedStudent, "Deactivated student not found");
      assert(deactivatedStudent.active === false, `Expected student to be inactive, got active=${deactivatedStudent.active}`);
      assert(deactivatedStudent.name === "Et navn som ikke skal oppdateres", `Expected student name to be unchanged, got "${deactivatedStudent.name}"`);
      assert(!deactivatedStudent.studentEnrollments.find(enrollment => enrollment.systemId === "elevforhold-som-skal-fjernes-2"), "Expected enrollment to be removed");
    })

    it("should update existing access correctly", () => {
      const updatedAccess = result.updatedAccess.find(a => (a as Access)._id === "existing-access-id");
      assert(updatedAccess, "Updated access not found");
      assert(updatedAccess.classes.find(c => c.type === "MANUELL-KLASSE-TILGANG" && c.systemId === "jeg-skal-ikke-bli-borte"), "Expected manual class access to be preserved");
      assert(!updatedAccess.classes.find(c => c.type === "AUTOMATISK-KLASSE-TILGANG" && c.systemId === "jeg-skal-bli-borte"), "Expected old automatic class access to be removed");
      assert(!updatedAccess.teachingGroups.find(c => c.type === "AUTOMATISK-UNDERVISNINGSGRUPPE-TILGANG" && c.systemId === "jeg-skal-bli-borte"), "Expected old automatic teaching group access to be removed");
      assert(!updatedAccess.contactTeacherGroups.find(c => c.type === "AUTOMATISK-KONTAKTLÆRERGRUPPE-TILGANG" && c.systemId === "jeg-skal-bli-borte"), "Expected old automatic contact teacher group access to be removed");
    })
  })
})