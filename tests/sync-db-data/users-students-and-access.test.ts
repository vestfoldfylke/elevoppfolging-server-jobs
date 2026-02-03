import assert from "node:assert"
import { writeFileSync } from "node:fs"
import { describe, it } from "node:test"
import { ObjectId } from "mongodb"
import { generateMockFintSchoolsWithStudents } from "../../src/lib/fint/generate-fint-mock-data.js"
import { repackPeriode, updateUsersStudentsAndAccess } from "../../src/lib/sync-db-data/users-students-and-access.js"
import type { DbAccess, DbAppStudent, DbAppUser, NewDbAccess, NewDbAppUser } from "../../src/types/db/db.js"
import type { GenerateMockFintSchoolsWithStudentsOptions } from "../../src/types/fint/fint-mock.js"
import type { FintElev, FintKlassemedlemskap, FintKontaktlarergruppemedlemskap, FintSchoolWithStudents, FintUndervisningsgruppemedlemskap } from "../../src/types/fint/fint-school-with-students.js"

const isValidAutoAccess = (access: DbAccess | NewDbAccess, schoolsWithStudents: FintSchoolWithStudents[], users: (DbAppUser | NewDbAppUser)[]): { valid: boolean; reason: string } => {
	const user = users.find((user) => user.entra.id === access.entraUserId)
	if (!user) return { valid: false, reason: `User with entra ID ${access.entraUserId} not found` }

	for (const classAccess of access.classes.filter((ca) => ca.type === "AUTOMATISK-KLASSE-TILGANG")) {
		const school = schoolsWithStudents.find((school) => school.skole?.skolenummer.identifikatorverdi === classAccess.schoolNumber)
		if (!school) return { valid: false, reason: `School with school number ${classAccess.schoolNumber} not found` }
		const shouldHaveAccess = school.skole.elevforhold.some((ef) => {
			const classToCheck: FintKlassemedlemskap = ef.klassemedlemskap.find((km) => km.klasse.systemId.identifikatorverdi === classAccess.systemId)
			if (!classToCheck) return false
			if (!repackPeriode(ef.gyldighetsperiode).active) return false
			if (!repackPeriode(classToCheck.gyldighetsperiode).active) return false
			return classToCheck.klasse.undervisningsforhold.some((uf) => {
				return uf.skoleressurs.feidenavn.identifikatorverdi.length > 0 && uf.skoleressurs.feidenavn.identifikatorverdi === user.feideName
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
		const shouldHaveAccess = school.skole.elevforhold.some((ef) => {
			const groupToCheck: FintUndervisningsgruppemedlemskap = ef.undervisningsgruppemedlemskap.find((km) => km.undervisningsgruppe.systemId.identifikatorverdi === groupAccess.systemId)
			if (!groupToCheck) return false
			if (!repackPeriode(ef.gyldighetsperiode).active) return false
			if (!repackPeriode(groupToCheck.gyldighetsperiode).active) return false
			return groupToCheck.undervisningsgruppe.undervisningsforhold.some((uf) => {
				return uf.skoleressurs.feidenavn.identifikatorverdi.length > 0 && uf.skoleressurs.feidenavn.identifikatorverdi === user.feideName
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
		const shouldHaveAccess = school.skole.elevforhold.some((ef) => {
			const groupToCheck: FintKontaktlarergruppemedlemskap = ef.kontaktlarergruppemedlemskap.find((km) => km.kontaktlarergruppe.systemId.identifikatorverdi === groupAccess.systemId)
			if (!groupToCheck) return false
			if (!repackPeriode(ef.gyldighetsperiode).active) return false
			if (!repackPeriode(groupToCheck.gyldighetsperiode).active) return false
			return groupToCheck.kontaktlarergruppe.undervisningsforhold.some((uf) => {
				return uf.skoleressurs.feidenavn.identifikatorverdi.length > 0 && uf.skoleressurs.feidenavn.identifikatorverdi === user.feideName
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

const studentIsValid = (student: DbAppStudent, schoolsWithStudents: FintSchoolWithStudents[]): { valid: boolean; reason: string } => {
	for (const enrollment of student.studentEnrollments) {
		const school = schoolsWithStudents.find((s) => s.skole.skolenummer.identifikatorverdi === enrollment.school.schoolNumber)
		if (!school) return { valid: false, reason: `School with school number ${enrollment.school.schoolNumber} not found` }
		const enrollmentInFint = school.skole.elevforhold.find((ef) => ef.systemId.identifikatorverdi === enrollment.systemId)
		if (!enrollmentInFint) return { valid: false, reason: `Enrollment with system ID ${enrollment.systemId} not found in school ${enrollment.school.schoolNumber}` }
		if (enrollmentInFint.elev.feidenavn.identifikatorverdi !== student.feideName) return { valid: false, reason: `Enrollment with system ID ${enrollment.systemId} has mismatched feideName` }
		if (enrollmentInFint.elev.person.fodselsnummer.identifikatorverdi !== student.ssn) return { valid: false, reason: `Enrollment with system ID ${enrollment.systemId} has mismatched ssn` }
		if (enrollmentInFint.elev.elevnummer.identifikatorverdi !== student.studentNumber) return { valid: false, reason: `Enrollment with system ID ${enrollment.systemId} has mismatched student number` }
		const repackedPeriode = repackPeriode(enrollmentInFint.gyldighetsperiode)
		if (repackedPeriode.active !== enrollment.period.active) return { valid: false, reason: `Enrollment with system ID ${enrollment.systemId} has mismatched active status` }
		const allClassesPresent = enrollmentInFint.klassemedlemskap.every((km) => {
			return enrollment.classMemberships.some((cm) => cm.systemId === km.systemId.identifikatorverdi)
		})
		if (!allClassesPresent) return { valid: false, reason: `Enrollment with system ID ${enrollment.systemId} is missing class memberships` }
		const allTeachingGroupsPresent = enrollmentInFint.undervisningsgruppemedlemskap.every((ugm) => {
			return enrollment.teachingGroupMemberships.some((tgm) => tgm.systemId === ugm.systemId.identifikatorverdi)
		})
		if (!allTeachingGroupsPresent) return { valid: false, reason: `Enrollment with system ID ${enrollment.systemId} is missing teaching group memberships` }
		const allContactTeacherGroupsPresent = enrollmentInFint.kontaktlarergruppemedlemskap.every((cgm) => {
			return enrollment.contactTeacherGroupMemberships.some((ctgm) => ctgm.systemId === cgm.systemId.identifikatorverdi)
		})
		if (!allContactTeacherGroupsPresent) return { valid: false, reason: `Enrollment with system ID ${enrollment.systemId} is missing contact teacher group memberships` }
	}
	return { valid: true, reason: "" }
}

describe("repackPeriode", () => {
	it("should return active true for periode with no end date", () => {
		const periode = { start: "2020-01-01" }
		const repacked = repackPeriode(periode)
		assert(repacked.active === true, `Expected active true, got ${repacked.active}`)
	})

	it("should return active false for periode with end date in the past", () => {
		const periode = { start: "2020-01-01", slutt: "2020-12-31" }
		const repacked = repackPeriode(periode)
		assert(repacked.active === false, `Expected active false, got ${repacked.active}`)
	})

	it("should return active false for periode with start date in the future", () => {
		const periode = { start: "2999-01-01" }
		const repacked = repackPeriode(periode)
		assert(repacked.active === false, `Expected active false, got ${repacked.active}`)
	})

	it("should return active false for periode when periode is null", () => {
		const repacked = repackPeriode(null)
		assert(repacked.active === false, `Expected active false, got ${repacked.active}`)
	})

	it("should return active false for periode when periode is undefined", () => {
		const repacked = repackPeriode(undefined)
		assert(repacked.active === false, `Expected active false, got ${repacked.active}`)
	})

	it("should return active false when start is not a valid date", () => {
		const periode = { start: "not-a-date-string" }
		const repacked = repackPeriode(periode)
		assert(repacked.active === false, `Expected active false, got ${repacked.active}`)
	})

	it("should return active false when slutt is not a valid date", () => {
		const periode = { start: "2022-01-01", slutt: "not-a-date-string" }
		const repacked = repackPeriode(periode)
		assert(repacked.active === false, `Expected active false, got ${repacked.active}`)
	})

	it("should return active false when end is before start", () => {
		const periode = { start: "2022-01-01", slutt: "2021-01-01" }
		const repacked = repackPeriode(periode)
		assert(repacked.active === false, `Expected active false, got ${repacked.active}`)
	})
})

describe("sync-db-data/users-students-and-access", () => {
	const mockConfig: GenerateMockFintSchoolsWithStudentsOptions = {
		numberOfKlasser: 5,
		numberOfKontaktlarergrupper: 5,
		numberOfUndervisningsgrupper: 5,
		numberOfUndervisningsforhold: 5,
		numberOfStudents: 10,
		schoolNames: ["School 1", "School 2"]
	}
	const mockSchools: FintSchoolWithStudents[] = generateMockFintSchoolsWithStudents(mockConfig)

	writeFileSync("./tests/sync-db-data/mock-fint-schools.json", JSON.stringify(mockSchools, null, 2))

	describe("data is mapped correctly when only given mockSchools", () => {
		const result = updateUsersStudentsAndAccess([], [], [], mockSchools, [])

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
				const validation = studentIsValid(student as DbAppStudent, mockSchools)
				assert(validation.valid, `Student validation failed: ${validation.reason}`)
			}
		})
	})

	describe("data is mapped and updated correctly when previous data is present", () => {
		const existingUserId = new ObjectId()
		const currentUsers: DbAppUser[] = [
			{
				_id: existingUserId,
				entra: {
					id: "existing-user-id",
					companyName: "Existing Company",
					department: "Existing Department",
					displayName: "Existing User",
					userPrincipalName: "existing.user@company.com"
				},
				feideName: "existing.feidenavn"
			}
		]

		const getRandomElev = (exclude: FintElev[]): FintElev => {
			let elev: FintElev
			const maxAttempts = 100
			let attempts = 0
			while (
				elev === undefined ||
				exclude.some(
					(e) =>
						e.systemId.identifikatorverdi === elev.systemId.identifikatorverdi ||
						e.person.fodselsnummer.identifikatorverdi === elev.person.fodselsnummer.identifikatorverdi ||
						e.feidenavn.identifikatorverdi === elev.feidenavn.identifikatorverdi
				)
			) {
				if (attempts >= maxAttempts) {
					throw new Error(`Failed to find a unique elev after maximum attempts (${maxAttempts})`)
				}
				const schoolIndex = Math.floor(Math.random() * mockSchools.length)
				const school = mockSchools[schoolIndex]
				const elevforholdIndex = Math.floor(Math.random() * school.skole.elevforhold.length)
				elev = school.skole.elevforhold[elevforholdIndex].elev
				attempts++
			}
			return elev
		}

		const studentNameUpdate = getRandomElev([])
		if (!studentNameUpdate) throw new Error("Mock data generation failed, no students found")
		const studentSsnUpdate = getRandomElev([studentNameUpdate])
		if (!studentSsnUpdate) throw new Error("Mock data generation failed, studentSsnUpdate not found")
		const studentSystemIdUpdate = getRandomElev([studentNameUpdate, studentSsnUpdate])
		if (!studentSystemIdUpdate) throw new Error("Mock data generation failed, studentSystemIdUpdate not found")
		const currentStudents: DbAppStudent[] = [
			{
				_id: new ObjectId(),
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
				_id: new ObjectId(),
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
				_id: new ObjectId(),
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
				_id: new ObjectId(),
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
						granted: {
							at: "samma driten",
							by: {
								_id: "some-admin-id",
								name: "Some Admin"
							}
						}
					}
				],
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

		const result = updateUsersStudentsAndAccess(currentUsers, currentStudents, currentAccess, mockSchools, [])
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

		it("should update existing student name and student number correctly", () => {
			const updatedStudent = result.updatedStudents.find((s) => s.systemId === studentNameUpdate.systemId.identifikatorverdi)
			assert(updatedStudent, "Updated student not found")
			assert(!updatedStudent.studentEnrollments.find((enrollment) => enrollment.systemId === "elevforhold-som-skal-fjernes"), "Expected old enrollment to be removed")
			assert(
				updatedStudent.name !== "Et navn som skal oppdateres",
				`Expected student name to be updated, got "${updatedStudent.name}" but should have been "${studentNameUpdate.person.navn.fornavn} ${studentNameUpdate.person.navn.etternavn}"`
			)
			assert(
				updatedStudent.studentNumber === studentNameUpdate.elevnummer.identifikatorverdi,
				`Expected student number to be updated, got "${updatedStudent.studentNumber}" but should have been "${studentNameUpdate.elevnummer.identifikatorverdi}"`
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

		it("should deactivate students and remove enrollments when student is no longer in FINT", () => {
			const deactivatedStudent = result.updatedStudents.find((s) => s.systemId === "jeg-finnes-ikke-i-fint-lenger")
			assert(deactivatedStudent, "Deactivated student not found")
			assert(deactivatedStudent.active === false, `Expected student to be inactive, got active=${deactivatedStudent.active}`)
			assert(deactivatedStudent.name === "Et navn som ikke skal oppdateres", `Expected student name to be unchanged, got "${deactivatedStudent.name}"`)
			assert(!deactivatedStudent.studentEnrollments.find((enrollment) => enrollment.systemId === "elevforhold-som-skal-fjernes-2"), "Expected enrollment to be removed")
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
				const validation = studentIsValid(student as DbAppStudent, mockSchools)
				assert(validation.valid, `Student validation failed: ${validation.reason}`)
			}
		})
	})
})
