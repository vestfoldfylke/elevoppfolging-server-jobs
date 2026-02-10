import type { User } from "@microsoft/microsoft-graph-types"
import { logger } from "@vestfoldfylke/loglady"
import { ObjectId } from "mongodb"
import { FEIDENAME_SUFFIX, MOCK_FINT } from "../../config.js"
import type {
	ClassAutoAccessEntry,
	ClassMembership,
	ContactTeacherGroupAutoAccessEntry,
	ContactTeacherGroupMembership,
	DbAccess,
	DbAppStudent,
	DbAppUser,
	NewAccess,
	NewAppStudent,
	NewAppUser,
	Period,
	School,
	StudentEnrollment,
	Teacher,
	TeachingGroupAutoAccessEntry,
	TeachingGroupMembership
} from "../../types/db/shared-types.js"
import type {
	FintElev,
	FintElevforhold,
	FintGyldighetsPeriode,
	FintKlassemedlemskap,
	FintKontaktlarergruppemedlemskap,
	FintSchoolWithStudents,
	FintSkole,
	FintUndervisningsforhold,
	FintUndervisningsgruppemedlemskap
} from "../../types/fint/fint-school-with-students.js"

export type StupidMaybeArray<T> = Array<T | null> | null | undefined

const getValidGraphQlArray = <T, U>(input: StupidMaybeArray<T>, typeName: string, elevOrMessage: FintElev | string): U => {
	if (input === null || input === undefined) {
		if (typeof elevOrMessage === "string") {
			logger.warn("Melding: {Message}. Ressursen har ingen {Type}", elevOrMessage, typeName)
		} else {
			logger.warn(
				"Person med brukernavn {Username} har ingen {Type}",
				elevOrMessage.feidenavn || elevOrMessage.elevnummer || `${elevOrMessage.person.navn.fornavn} ${elevOrMessage.person.navn.etternavn}`,
				typeName
			)
		}
		return [] as U
	}

	return input.filter((item: T | null) => item !== null) as U
}

const isActive = (start: string, slutt: string | null | undefined): boolean => {
	const now: Date = new Date()
	const startDate: Date = new Date(start)

	if (!slutt) {
		return now > startDate
	}

	const sluttDate: Date = new Date(slutt)
	return now > startDate && now < sluttDate
}

export const repackPeriode = (periode: FintGyldighetsPeriode | null | undefined): Period => {
	if (!periode) {
		return {
			start: null,
			end: null,
			active: false
		}
	}

	return {
		start: periode.start && `${periode.start.substring(0, 11)}00:00:00.000Z`,
		end: periode.slutt ? `${periode.slutt.substring(0, 11)}23:59:59.999Z` : null,
		active: isActive(periode.start, periode.slutt)
	}
}

export const updateUsersStudentsAndAccess = (
	currentAppUsers: DbAppUser[],
	currentStudents: DbAppStudent[],
	currentAccess: DbAccess[],
	fintSchoolsWithStudents: FintSchoolWithStudents[],
	enterpriseApplicationUsers: User[]
): { updatedAppUsers: (DbAppUser | NewAppUser)[]; updatedStudents: (DbAppStudent | NewAppStudent)[]; updatedAccess: (DbAccess | NewAccess)[] } => {
	const syncTimestamp: string = new Date().toISOString()

	const updatedAppUsers: (DbAppUser | NewAppUser)[] = JSON.parse(JSON.stringify(currentAppUsers))
	const linkedMockUsers: Record<string, boolean> = {}

	const updatedStudents: (DbAppStudent | NewAppStudent)[] = JSON.parse(JSON.stringify(currentStudents))
	// wipe all previous student enrollments, and set all students to inactive
	updatedStudents.forEach((student: DbAppStudent) => {
		student.studentEnrollments = []
		student.active = false
	})

	const updatedAccess: (DbAccess | NewAccess)[] = JSON.parse(JSON.stringify(currentAccess))
	// wipe previous auto access
	updatedAccess.forEach((access: DbAccess) => {
		access.classes = access.classes.filter((entry) => entry.type !== "AUTOMATISK-KLASSE-TILGANG")
		access.teachingGroups = access.teachingGroups.filter((entry) => entry.type !== "AUTOMATISK-UNDERVISNINGSGRUPPE-TILGANG")
		access.contactTeacherGroups = access.contactTeacherGroups.filter((entry) => entry.type !== "AUTOMATISK-KONTAKTLÆRERGRUPPE-TILGANG")
	})

	// Internal helper/repack functions - don't need state, so no class for now
	const upsertAppUser = (enterpriseApplicationUser: User) => {
		let appUser: DbAppUser | NewAppUser | undefined = updatedAppUsers.find((user: DbAppUser | NewAppUser) => user.entra.id === enterpriseApplicationUser.id)
		if (!appUser) {
			if (
				!enterpriseApplicationUser.id ||
				!enterpriseApplicationUser.companyName ||
				!enterpriseApplicationUser.displayName ||
				!enterpriseApplicationUser.userPrincipalName ||
				!enterpriseApplicationUser.onPremisesSamAccountName
			) {
				logger.error("User from EntraID is missing crucial info, skipping user: {@User}", enterpriseApplicationUser)
				return
			}
			logger.info("Døtter inn denne appuser kødden: {DisplayName}", enterpriseApplicationUser.displayName)
			appUser = {
				active: Boolean(enterpriseApplicationUser.accountEnabled),
				feideName: `${enterpriseApplicationUser.onPremisesSamAccountName}@${FEIDENAME_SUFFIX}`,
				entra: {
					id: enterpriseApplicationUser.id,
					userPrincipalName: enterpriseApplicationUser.userPrincipalName,
					displayName: enterpriseApplicationUser.displayName,
					companyName: enterpriseApplicationUser.companyName,
					department: enterpriseApplicationUser.department
				}
			}
			updatedAppUsers.push(appUser)
			return
		}
		// Update existing user info
		if (enterpriseApplicationUser.userPrincipalName) {
			appUser.entra.userPrincipalName = enterpriseApplicationUser.userPrincipalName
		}
		if (enterpriseApplicationUser.displayName) {
			appUser.entra.displayName = enterpriseApplicationUser.displayName
		}
		if (enterpriseApplicationUser.companyName) {
			appUser.entra.companyName = enterpriseApplicationUser.companyName
		}
		if (enterpriseApplicationUser.department) {
			appUser.entra.department = enterpriseApplicationUser.department
		}
		if (enterpriseApplicationUser.onPremisesSamAccountName) {
			appUser.feideName = `${enterpriseApplicationUser.onPremisesSamAccountName}@${FEIDENAME_SUFFIX}`
		}
		appUser.active = Boolean(enterpriseApplicationUser.accountEnabled)
	}

	const addFintMockTeacherToAppUsers = (undervisningsforhold: FintUndervisningsforhold): NewAppUser => {
		if (!MOCK_FINT) {
			throw new Error("addFintMockUsersToAppUsers should only be called when MOCK_FINT is true")
		}
		if (!undervisningsforhold.skoleressurs.feidenavn || !undervisningsforhold.skoleressurs.feidenavn.identifikatorverdi) {
			logger.warn("Undervisningsforhold med systemId {SystemId} har ingen skoleressurs med feidenavn tilknyttet, hopper over", undervisningsforhold.systemId.identifikatorverdi)
			throw new Error(`Undervisningsforhold med systemId ${undervisningsforhold.systemId.identifikatorverdi} har ingen skoleressurs med feidenavn - lag nå mock-data som gir dette da, takk`)
		}
		const feideName: string = undervisningsforhold.skoleressurs.feidenavn.identifikatorverdi
		const firstName: string = undervisningsforhold.skoleressurs.person?.navn.fornavn || "Mock"
		const lastName: string = undervisningsforhold.skoleressurs.person?.navn.etternavn || "Mockesen"
		// add to app users - and use inside repack, for now. Det er mock-lærere, så vi driter i å oppdatere navn osv.
		const mockAppUser: NewAppUser = {
			feideName,
			active: true,
			entra: {
				id: `mock-${feideName}`,
				userPrincipalName: feideName,
				displayName: `${firstName} ${lastName}`,
				companyName: "Mock Company",
				department: "Mock Department"
			}
		}
		updatedAppUsers.push(mockAppUser)
		return mockAppUser
	}

	const findUserByFeideName = (feideName: string): DbAppUser | NewAppUser | null => {
		const user: DbAppUser | NewAppUser | undefined = updatedAppUsers.find((appUser: DbAppUser | NewAppUser) => appUser.feideName?.toLowerCase() === feideName.toLowerCase())
		return user || null
	}

	const repackTeachingAssignments = (undervisningsforhold: StupidMaybeArray<FintUndervisningsforhold>, elev: FintElev): Teacher[] => {
		const validUndervisningsforhold: FintUndervisningsforhold[] = getValidGraphQlArray<FintUndervisningsforhold, FintUndervisningsforhold[]>(undervisningsforhold, "undervisningsforhold", elev)

		const undervisningsforholdWithTeacher: FintUndervisningsforhold[] = validUndervisningsforhold.filter((undervisningsforhold: FintUndervisningsforhold) => {
			if (!undervisningsforhold.skoleressurs.feidenavn || !undervisningsforhold.skoleressurs.feidenavn.identifikatorverdi) {
				logger.warn("Undervisningsforhold med systemId {SystemId} har ingen skoleressurs med feidenavn tilknyttet, hopper over", undervisningsforhold.systemId.identifikatorverdi)
				return false
			}
			return true
		})

		return undervisningsforholdWithTeacher.map((undervisningsforhold: FintUndervisningsforhold) => {
			const feideName: string = undervisningsforhold.skoleressurs.feidenavn?.identifikatorverdi || "Rune sa det var greit" // Den er vel sjekka rett over vel
			const firstName: string = undervisningsforhold.skoleressurs.person?.navn.fornavn || "Ukjent fornavn"
			const lastName: string = undervisningsforhold.skoleressurs.person?.navn.etternavn || "Ukjent etternavn"

			let entraUserId: string | null = findUserByFeideName(feideName)?.entra.id || null
			// Bare fyll opp med appuserids til å begynne med - deretter kan du opprette mock brukere
			if (!entraUserId && MOCK_FINT) {
				// Hvis det er noen entra app-users som ikke har fått seg en lærer-knytning, så knytter vi opp denne læreren til en app-user. Hvis ikke kan vi bare legge den til som mock-app-user
				const userToLink = updatedAppUsers.find(
					(appUser: DbAppUser | NewAppUser) => !linkedMockUsers[appUser.entra.id] && appUser.active && enterpriseApplicationUsers.some((entraUser) => entraUser.id === appUser.entra.id)
				)
				if (userToLink) {
					logger.warn("Har flere app-brukere å linke opp i MOCK - linker opp denne læreren {TeacherName} til app-bruker {DisplayName}", `${firstName} ${lastName}`, userToLink.entra.displayName)
					userToLink.feideName = feideName

					linkedMockUsers[userToLink.entra.id] = true

					return {
						entraUserId: userToLink.entra.id,
						feideName: feideName,
						name: `${firstName} ${lastName}`,
						systemId: undervisningsforhold.skoleressurs.systemId.identifikatorverdi
					}
				}

				const newMockUser: NewAppUser = addFintMockTeacherToAppUsers(undervisningsforhold)
				entraUserId = newMockUser.entra.id
			}
			return {
				entraUserId,
				feideName: feideName,
				name: `${firstName} ${lastName}`,
				systemId: undervisningsforhold.skoleressurs.systemId.identifikatorverdi
			}
		})
	}

	const repackClassMemberships = (klassemedlemskap: StupidMaybeArray<FintKlassemedlemskap>, elev: FintElev): ClassMembership[] => {
		const validKlassemedlemskap: FintKlassemedlemskap[] = getValidGraphQlArray<FintKlassemedlemskap, FintKlassemedlemskap[]>(klassemedlemskap, "klassemedlemskap", elev)

		return validKlassemedlemskap.map((klassemedlemskap: FintKlassemedlemskap) => {
			return {
				systemId: klassemedlemskap.systemId.identifikatorverdi,
				period: repackPeriode(klassemedlemskap.gyldighetsperiode),
				classGroup: {
					systemId: klassemedlemskap.klasse.systemId.identifikatorverdi,
					name: klassemedlemskap.klasse.navn,
					teachers: repackTeachingAssignments(klassemedlemskap.klasse.undervisningsforhold, elev)
				}
			}
		})
	}

	const repackTeachingGroupMemberships = (undervisningsgruppemedlemskap: StupidMaybeArray<FintUndervisningsgruppemedlemskap>, elev: FintElev): TeachingGroupMembership[] => {
		const validUndervisningsgruppemedlemskap: FintUndervisningsgruppemedlemskap[] = getValidGraphQlArray<FintUndervisningsgruppemedlemskap, FintUndervisningsgruppemedlemskap[]>(
			undervisningsgruppemedlemskap,
			"undervisningsgruppemedlemskap",
			elev
		)

		return validUndervisningsgruppemedlemskap.map((undervisningsgruppemedlemskap: FintUndervisningsgruppemedlemskap) => {
			return {
				systemId: undervisningsgruppemedlemskap.systemId.identifikatorverdi,
				period: repackPeriode(undervisningsgruppemedlemskap.gyldighetsperiode),
				teachingGroup: {
					systemId: undervisningsgruppemedlemskap.undervisningsgruppe.systemId.identifikatorverdi,
					name: undervisningsgruppemedlemskap.undervisningsgruppe.navn,
					teachers: repackTeachingAssignments(undervisningsgruppemedlemskap.undervisningsgruppe.undervisningsforhold, elev)
				}
			}
		})
	}

	const repackContactTeacherGroupMemberships = (kontaktlarergruppemedlemskap: StupidMaybeArray<FintKontaktlarergruppemedlemskap>, elev: FintElev): ContactTeacherGroupMembership[] => {
		const validKontaktlarergruppemedlemskap: FintKontaktlarergruppemedlemskap[] = getValidGraphQlArray<FintKontaktlarergruppemedlemskap, FintKontaktlarergruppemedlemskap[]>(
			kontaktlarergruppemedlemskap,
			"kontaktlarergruppemedlemskap",
			elev
		)

		return validKontaktlarergruppemedlemskap.map((kontaktlarergruppemedlemskap: FintKontaktlarergruppemedlemskap) => {
			return {
				systemId: kontaktlarergruppemedlemskap.systemId.identifikatorverdi,
				period: repackPeriode(kontaktlarergruppemedlemskap.gyldighetsperiode),
				contactTeacherGroup: {
					systemId: kontaktlarergruppemedlemskap.kontaktlarergruppe.systemId.identifikatorverdi,
					name: kontaktlarergruppemedlemskap.kontaktlarergruppe.navn,
					teachers: repackTeachingAssignments(kontaktlarergruppemedlemskap.kontaktlarergruppe.undervisningsforhold, elev)
				}
			}
		})
	}

	const repackSchool = (skole: FintSkole): School => {
		return {
			name: skole.navn,
			schoolNumber: skole.skolenummer.identifikatorverdi
		}
	}

	const upsertTeacherAccess = (teacher: Teacher, accessEntry: ClassAutoAccessEntry | TeachingGroupAutoAccessEntry | ContactTeacherGroupAutoAccessEntry): void => {
		if (!teacher.entraUserId) {
			logger.warn("Kan ikke oppdatere tilgang for lærer {TeacherName} uten app-bruker-entra-id", teacher.name)
			return
		}
		let teacherAccess: DbAccess | NewAccess | undefined = updatedAccess.find((access: DbAccess) => access.entraUserId === teacher.entraUserId)
		if (!teacherAccess) {
			teacherAccess = {
				entraUserId: teacher.entraUserId,
				name: teacher.name,
				schools: [],
				programAreas: [],
				classes: [],
				contactTeacherGroups: [],
				teachingGroups: [],
				students: []
			}
			updatedAccess.push(teacherAccess)
		}
		switch (accessEntry.type) {
			case "AUTOMATISK-KLASSE-TILGANG": {
				const alreadyHasClassAccess = teacherAccess.classes.some((entry) => entry.systemId === accessEntry.systemId)
				if (!alreadyHasClassAccess) {
					teacherAccess.classes.push(accessEntry)
					logger.info("La til automatisk klasse-tilgang for lærer {TeacherName} til klasse {ClassId}", teacher.name, accessEntry.systemId)
				}
				break
			}
			case "AUTOMATISK-UNDERVISNINGSGRUPPE-TILGANG": {
				const alreadyHasTeachingGroupAccess = teacherAccess.teachingGroups.some((entry) => entry.systemId === accessEntry.systemId)
				if (!alreadyHasTeachingGroupAccess) {
					teacherAccess.teachingGroups.push(accessEntry)
					logger.info("La til automatisk undervisningsgruppe-tilgang for lærer {TeacherName} til undervisningsgruppe {TeachingGroupId}", teacher.name, accessEntry.systemId)
				}
				break
			}
			case "AUTOMATISK-KONTAKTLÆRERGRUPPE-TILGANG": {
				const alreadyHasContactTeacherGroupAccess = teacherAccess.contactTeacherGroups.some((entry) => entry.systemId === accessEntry.systemId)
				if (!alreadyHasContactTeacherGroupAccess) {
					teacherAccess.contactTeacherGroups.push(accessEntry)
					logger.info("La til automatisk kontaktlærergruppe-tilgang for lærer {TeacherName} til kontaktlærergruppe {ContactTeacherGroupId}", teacher.name, accessEntry.systemId)
				}
				break
			}
		}
	}

	// Main mapping logic
	logger.info("Starter synk av brukere, elever og tilganger basert på FINT-data og EntraID-brukere")
	logger.info("Synker litt entrabrukere")
	enterpriseApplicationUsers.forEach((enterpriseApplicationUser: User) => {
		upsertAppUser(enterpriseApplicationUser)
	})
	logger.info("Setter alle brukere som ikke finnes i enterprise-app til inactive")
	updatedAppUsers.forEach((appUser: DbAppUser | NewAppUser) => {
		if (!enterpriseApplicationUsers.some((enterpriseApplicationUser: User) => enterpriseApplicationUser.id === appUser.entra.id)) {
			appUser.active = false
			logger.info("Setter app-bruker {DisplayName} til inactive, da den ikke lenger finnes i EntraID", appUser.entra.displayName)
		}
	})
	logger.info("Synket ferdig litt entrabrukere")

	logger.info("Starter synk av elever og tilganger basert på FINT-data")
	for (const schoolWithStudents of fintSchoolsWithStudents) {
		if (!schoolWithStudents.skole) {
			logger.error("Fikk ikke skole-data for skole med skolenummer {SchoolNumber}, hopper over", schoolWithStudents.skole.skolenummer.identifikatorverdi)
			continue
		}

		const school: School = repackSchool(schoolWithStudents.skole)

		logger.info("Behandler eleveforhold for skole {SchoolName} ({SchoolNumber})", school.name, school.schoolNumber)

		const validElevforhold: FintElevforhold[] = getValidGraphQlArray<FintElevforhold, FintElevforhold[]>(
			schoolWithStudents.skole.elevforhold,
			"elevforhold",
			`Skole med skolenummer ${school.schoolNumber} har ingen elevforhold`
		)

		for (const elevforhold of validElevforhold) {
			const elev: FintElev = elevforhold.elev

			if (!elev.systemId || !elev.systemId.identifikatorverdi) {
				logger.error("Elev {DisplayName} har ingen systemId, hopper over", elev.person.navn.fornavn)
				continue
			}

			if (!elev.elevnummer || !elev.elevnummer.identifikatorverdi) {
				logger.error("Elev {DisplayName} har ingen elevnummer, hopper over", elev.person.navn.fornavn)
				continue
			}

			if (!elev.feidenavn || !elev.feidenavn.identifikatorverdi) {
				logger.error("Elev {DisplayName} har ingen feidenavn, hopper over", elev.person.navn.fornavn)
				continue
			}

			logger.info("Døtter inn denne elevkødden: {DisplayName}", elev.person.navn.fornavn)

			const studentEnrollment: StudentEnrollment = {
				systemId: elevforhold.systemId.identifikatorverdi,
				classMemberships: repackClassMemberships(elevforhold.klassemedlemskap, elev),
				teachingGroupMemberships: repackTeachingGroupMemberships(elevforhold.undervisningsgruppemedlemskap, elev),
				contactTeacherGroupMemberships: repackContactTeacherGroupMemberships(elevforhold.kontaktlarergruppemedlemskap, elev),
				period: repackPeriode(elevforhold.gyldighetsperiode),
				school,
				mainSchool: Boolean(elevforhold.hovedskole)
			}

			// Går gjennom klassemedlemskap for å oppdatere lærer-tilganger - deretter kontaklærergruppemedlemskap og undervisningsgruppemedlemskap
			if (studentEnrollment.period.active) {
				logger.info("Oppdaterer lærer-tilganger for elev {StudentName}", elev.person.navn.fornavn)
				for (const classMembership of studentEnrollment.classMemberships.filter((cm) => cm.period.active)) {
					for (const teacher of classMembership.classGroup.teachers) {
						const accessEntry: ClassAutoAccessEntry = {
							systemId: classMembership.classGroup.systemId,
							schoolNumber: school.schoolNumber,
							type: "AUTOMATISK-KLASSE-TILGANG",
							granted: {
								by: {
									_id: "SYSTEM",
									name: "SYNC JOB"
								},
								at: new Date().toISOString()
							}
						}
						upsertTeacherAccess(teacher, accessEntry)
					}
				}
				for (const teachingGroupMembership of studentEnrollment.teachingGroupMemberships.filter((tgm) => tgm.period.active)) {
					for (const teacher of teachingGroupMembership.teachingGroup.teachers) {
						const accessEntry: TeachingGroupAutoAccessEntry = {
							systemId: teachingGroupMembership.teachingGroup.systemId,
							schoolNumber: school.schoolNumber,
							type: "AUTOMATISK-UNDERVISNINGSGRUPPE-TILGANG",
							granted: {
								by: {
									_id: "SYSTEM",
									name: "SYNC JOB"
								},
								at: new Date().toISOString()
							}
						}
						upsertTeacherAccess(teacher, accessEntry)
					}
				}
				for (const contactTeacherGroupMembership of studentEnrollment.contactTeacherGroupMemberships.filter((ctgm) => ctgm.period.active)) {
					for (const teacher of contactTeacherGroupMembership.contactTeacherGroup.teachers) {
						const accessEntry: ContactTeacherGroupAutoAccessEntry = {
							systemId: contactTeacherGroupMembership.contactTeacherGroup.systemId,
							schoolNumber: school.schoolNumber,
							type: "AUTOMATISK-KONTAKTLÆRERGRUPPE-TILGANG",
							granted: {
								by: {
									_id: "SYSTEM",
									name: "SYNC JOB"
								},
								at: new Date().toISOString()
							}
						}
						upsertTeacherAccess(teacher, accessEntry)
					}
				}
			}

			let currentStudent: DbAppStudent | NewAppStudent | undefined = updatedStudents.find((student: DbAppStudent) => {
				return student.systemId === elev.systemId.identifikatorverdi || student.ssn === elev.person.fodselsnummer.identifikatorverdi
			})
			if (!currentStudent) {
				currentStudent = {
					active: false,
					systemId: elev.systemId.identifikatorverdi,
					studentNumber: elev.elevnummer.identifikatorverdi,
					feideName: elev.feidenavn.identifikatorverdi,
					ssn: elev.person.fodselsnummer.identifikatorverdi,
					name: `${elev.person.navn.fornavn} ${elev.person.navn.mellomnavn ? `${elev.person.navn.mellomnavn} ` : ""}${elev.person.navn.etternavn}`,
					studentEnrollments: [],
					lastSynced: syncTimestamp
				}
				updatedStudents.push(currentStudent)
			} else {
				// Set ObjectId again (JSON.parse/stringify removes it)
				;(currentStudent as DbAppStudent)._id = new ObjectId((currentStudent as DbAppStudent)._id)
				// Update basic student data in case of changes
				currentStudent.systemId = elev.systemId.identifikatorverdi // Obs, skal vi gjøre dette?
				currentStudent.ssn = elev.person.fodselsnummer.identifikatorverdi // Ja, dette skal vi gjøre
				currentStudent.name = `${elev.person.navn.fornavn} ${elev.person.navn.mellomnavn ? `${elev.person.navn.mellomnavn} ` : ""}${elev.person.navn.etternavn}`
				currentStudent.feideName = elev.feidenavn.identifikatorverdi
				currentStudent.ssn = elev.person.fodselsnummer.identifikatorverdi
				currentStudent.studentNumber = elev.elevnummer.identifikatorverdi
				currentStudent.lastSynced = syncTimestamp
			}

			currentStudent.studentEnrollments.push(studentEnrollment)
			// Set student active status based on at least one active enrollment
			currentStudent.active = currentStudent.studentEnrollments.some((enrollment) => enrollment.period.active)
		}
	}
	logger.info("Ferdig med synk av elever og tilganger basert på FINT-data")
	return {
		updatedAppUsers,
		updatedStudents,
		updatedAccess
	}
}
