import type { User } from "@microsoft/microsoft-graph-types"
import { logger } from "@vestfoldfylke/loglady"
import { ObjectId } from "mongodb"
import { APP_NAME, FEIDENAME_SUFFIX, MOCK_FINT } from "../../config.js"
import type {
  ClassAutoAccessEntry,
  ClassMembership,
  ContactTeacherGroupAutoAccessEntry,
  ContactTeacherGroupMembership,
  DbAccess,
  DbAppStudent,
  DbAppUser,
  DbSchool,
  EditorData,
  NewAccess,
  NewAppStudent,
  NewAppUser,
  NewSchool,
  Period,
  SchoolInfo,
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

export const repackPeriode = (periode: FintGyldighetsPeriode | null | undefined): Period => {
  if (!periode) {
    return {
      start: null,
      end: null
    }
  }

  return {
    start: periode.start.length > 10 ? new Date(`${periode.start.substring(0, 11)}00:00:00.000Z`) : new Date(`${periode.start}T00:00:00.000Z`),
    end: periode.slutt ? (periode.slutt.length > 10 ? new Date(`${periode.slutt.substring(0, 11)}23:59:59.999Z`) : new Date(`${periode.slutt}T23:59:59.999Z`)) : null
  }
}

const cloneDbDocument = <T extends { _id: ObjectId }>(doc: T): T => {
  const temp = {
    ...doc,
    _id: doc._id.toString()
  }
  return { ...structuredClone(temp), _id: new ObjectId(doc._id) }
}

export const updateUsersStudentsAndAccess = (
  currentAppUsers: DbAppUser[],
  currentStudents: DbAppStudent[],
  currentAccess: DbAccess[],
  currentSchools: DbSchool[],
  fintSchoolsWithStudents: FintSchoolWithStudents[],
  enterpriseApplicationUsers: User[]
): { updatedAppUsers: (DbAppUser | NewAppUser)[]; updatedStudents: (DbAppStudent | NewAppStudent)[]; updatedAccess: (DbAccess | NewAccess)[]; updatedSchools: (DbSchool | NewSchool)[] } => {
  const syncTimestamp: Date = new Date()

  const editorData: EditorData = {
    by: {
      entraUserId: "system",
      fallbackName: APP_NAME
    },
    at: syncTimestamp
  }

  const updatedAppUsers: (DbAppUser | NewAppUser)[] = currentAppUsers.map(cloneDbDocument)
  const linkedMockUsers: Record<string, string> = {}

  const updatedStudents: (DbAppStudent | NewAppStudent)[] = currentStudents.map(cloneDbDocument)

  // wipe all previous student enrollments except manual, and set all students to inactive
  updatedStudents.forEach((student: DbAppStudent | NewAppStudent) => {
    student.studentEnrollments = student.studentEnrollments.filter((enrollment) => enrollment.source === "MANUAL")
  })

  const updatedAccess: (DbAccess | NewAccess)[] = currentAccess.map(cloneDbDocument)
  // wipe previous auto access
  updatedAccess.forEach((access: DbAccess | NewAccess) => {
    access.classes = access.classes.filter((entry) => entry.type !== "AUTOMATISK-KLASSE-TILGANG")
    access.teachingGroups = access.teachingGroups.filter((entry) => entry.type !== "AUTOMATISK-UNDERVISNINGSGRUPPE-TILGANG")
    access.contactTeacherGroups = access.contactTeacherGroups.filter((entry) => entry.type !== "AUTOMATISK-KONTAKTLÆRERGRUPPE-TILGANG")
  })

  const updatedSchools: (DbSchool | NewSchool)[] = currentSchools.map(cloneDbDocument)

  // Internal helper for checking if school comes from FINT
  const fintSchools: SchoolInfo[] = fintSchoolsWithStudents.map((s) => ({
    name: s.skole?.navn || "Ukjent skole",
    schoolNumber: s.skole?.skolenummer.identifikatorverdi || "Ukjent skolenummer"
  }))

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
          companyName: enterpriseApplicationUser.companyName || "Ukjent company",
          department: enterpriseApplicationUser.department || "Ukjent avdeling"
        },
        created: editorData,
        modified: editorData,
        source: "AUTO"
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
    appUser.modified = editorData
    appUser.source = "AUTO"
  }

  const findUserByFeideName = (feideName: string): DbAppUser | NewAppUser | null => {
    const user: DbAppUser | NewAppUser | undefined = updatedAppUsers.find((appUser: DbAppUser | NewAppUser) => appUser.feideName.toLowerCase() === feideName.toLowerCase())
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

      const teacherEntraUserId: string | null = findUserByFeideName(feideName)?.entra.id || null

      if (MOCK_FINT && !teacherEntraUserId) {
        // Hvis denne mock-læreren ikke er knyttet opp allerede, og det er noen entra app-users som ikke har fått seg en lærer-knytning, så knytter vi opp denne læreren til en app-user.
        const userToLink = updatedAppUsers.find(
          (appUser: DbAppUser | NewAppUser) => !linkedMockUsers[appUser.entra.id] && appUser.active && enterpriseApplicationUsers.some((entraUser) => entraUser.id === appUser.entra.id)
        )
        if (userToLink) {
          logger.warn("Har flere app-brukere å linke opp i MOCK - linker opp denne læreren {TeacherName} til app-bruker {DisplayName}", `${firstName} ${lastName}`, userToLink.entra.displayName)
          userToLink.feideName = feideName

          linkedMockUsers[userToLink.entra.id] = feideName

          return {
            entraUserId: userToLink.entra.id,
            feideName: feideName,
            name: `${firstName} ${lastName}`,
            systemId: undervisningsforhold.skoleressurs.systemId.identifikatorverdi
          }
        }
      }
      return {
        entraUserId: teacherEntraUserId,
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
          teachers: repackTeachingAssignments(klassemedlemskap.klasse.undervisningsforhold, elev),
          source: "AUTO"
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
          teachers: repackTeachingAssignments(undervisningsgruppemedlemskap.undervisningsgruppe.undervisningsforhold, elev),
          source: "AUTO"
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
          teachers: repackTeachingAssignments(kontaktlarergruppemedlemskap.kontaktlarergruppe.undervisningsforhold, elev),
          source: "AUTO"
        }
      }
    })
  }

  const repackSchool = (skole: FintSkole): SchoolInfo => {
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
    let teacherAccess: DbAccess | NewAccess | undefined = updatedAccess.find((access: DbAccess | NewAccess) => access.entraUserId === teacher.entraUserId)
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
      logger.error("Fikk ikke skole-data for skole {@School}, hopper over", schoolWithStudents)
      continue
    }

    const school: SchoolInfo = repackSchool(schoolWithStudents.skole)

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
        mainSchool: Boolean(elevforhold.hovedskole),
        source: "AUTO"
      }

      // Går gjennom klassemedlemskap for å oppdatere lærer-tilganger - deretter kontaklærergruppemedlemskap og undervisningsgruppemedlemskap
      logger.info("Oppdaterer lærer-tilganger for elev {StudentName}", elev.person.navn.fornavn)
      for (const classMembership of studentEnrollment.classMemberships) {
        for (const teacher of classMembership.classGroup.teachers) {
          const accessEntry: ClassAutoAccessEntry = {
            systemId: classMembership.classGroup.systemId,
            schoolNumber: school.schoolNumber,
            type: "AUTOMATISK-KLASSE-TILGANG",
            granted: editorData,
            source: "AUTO"
          }
          upsertTeacherAccess(teacher, accessEntry)
        }
      }
      for (const teachingGroupMembership of studentEnrollment.teachingGroupMemberships) {
        for (const teacher of teachingGroupMembership.teachingGroup.teachers) {
          const accessEntry: TeachingGroupAutoAccessEntry = {
            systemId: teachingGroupMembership.teachingGroup.systemId,
            schoolNumber: school.schoolNumber,
            type: "AUTOMATISK-UNDERVISNINGSGRUPPE-TILGANG",
            granted: editorData,
            source: "AUTO"
          }
          upsertTeacherAccess(teacher, accessEntry)
        }
      }
      for (const contactTeacherGroupMembership of studentEnrollment.contactTeacherGroupMemberships) {
        for (const teacher of contactTeacherGroupMembership.contactTeacherGroup.teachers) {
          const accessEntry: ContactTeacherGroupAutoAccessEntry = {
            systemId: contactTeacherGroupMembership.contactTeacherGroup.systemId,
            schoolNumber: school.schoolNumber,
            type: "AUTOMATISK-KONTAKTLÆRERGRUPPE-TILGANG",
            granted: editorData,
            source: "AUTO"
          }
          upsertTeacherAccess(teacher, accessEntry)
        }
      }

      let currentStudent: DbAppStudent | NewAppStudent | undefined = updatedStudents.find((student: DbAppStudent | NewAppStudent) => {
        return student.systemId === elev.systemId.identifikatorverdi || student.ssn === elev.person.fodselsnummer.identifikatorverdi
      })
      if (!currentStudent) {
        currentStudent = {
          systemId: elev.systemId.identifikatorverdi,
          studentNumber: elev.elevnummer.identifikatorverdi,
          feideName: elev.feidenavn.identifikatorverdi,
          ssn: elev.person.fodselsnummer.identifikatorverdi,
          name: `${elev.person.navn.fornavn} ${elev.person.navn.mellomnavn ? `${elev.person.navn.mellomnavn} ` : ""}${elev.person.navn.etternavn}`,
          studentEnrollments: [],
          mainEnrollment: null,
          created: editorData,
          modified: editorData,
          source: "AUTO"
        }
        updatedStudents.push(currentStudent)
      } else {
        // Update basic student data in case of changes
        currentStudent.systemId = elev.systemId.identifikatorverdi // Obs, skal vi gjøre dette?
        currentStudent.ssn = elev.person.fodselsnummer.identifikatorverdi // Ja, dette skal vi gjøre
        currentStudent.name = `${elev.person.navn.fornavn} ${elev.person.navn.mellomnavn ? `${elev.person.navn.mellomnavn} ` : ""}${elev.person.navn.etternavn}`
        currentStudent.feideName = elev.feidenavn.identifikatorverdi
        currentStudent.ssn = elev.person.fodselsnummer.identifikatorverdi
        currentStudent.studentNumber = elev.elevnummer.identifikatorverdi
        currentStudent.modified = editorData
        currentStudent.source = "AUTO"
        // Add some props if missing
        currentStudent.created ??= editorData
        currentStudent.studentEnrollments ??= []
        currentStudent.mainEnrollment ??= null // haha
      }
      currentStudent.studentEnrollments.push(studentEnrollment)
    }
  }

  logger.info("Ferdig med å mappe elever og tilganger basert på FINT-data - finner og setter main-props for hver elev")
  // Etter at all mapping er gjort, så går vi gjennom alle elever og setter main-props basert på prioritert logikk

  updatedStudents.forEach((student: DbAppStudent | NewAppStudent) => {
    // Set _id to ObjectId again (removed by JSON.parse/stringify)
    if ("_id" in student) {
      student._id = new ObjectId(student._id)
    }

    if (student.studentEnrollments.length === 0) {
      return
    }

    // Set manual enrollments to expire if there is at least one AUTO enrollment for the same school, and set mainSchool to false on manual enrollments if there is an auto enrollment for any school with mainschool true
    const existingAutoEnrollmentSchools = student.studentEnrollments
      .filter((enrollment) => enrollment.source === "AUTO")
      .map((enrollment) => {
        return { schoolNumber: enrollment.school.schoolNumber, mainSchool: enrollment.mainSchool }
      })
    const now = new Date()
    student.studentEnrollments.forEach((enrollment) => {
      if (enrollment.source !== "MANUAL") {
        return
      }

      if (enrollment.mainSchool && existingAutoEnrollmentSchools.some((autoEnrollment) => autoEnrollment.mainSchool)) {
        logger.warn(
          "Setter manuell elevforhold for elev {StudentName} ved skole {SchoolNumber} til manuelt elevforhold.mainSchool til false, da det finnes et automatisk elevforhold for en FINT-skole som har mainSchool true.",
          student.name,
          enrollment.school.schoolNumber
        )
        enrollment.mainSchool = false
      }

      if (enrollment.period.end && enrollment.period.end < now) {
        return
      }

      if (existingAutoEnrollmentSchools.some((autoEnrollment) => autoEnrollment.schoolNumber === enrollment.school.schoolNumber)) {
        enrollment.period.end = now
        enrollment.mainSchool = false
        logger.warn(
          "Setter manuell elevforhold for elev {StudentName} ved skole {SchoolNumber} til å gå ut NÅ og setter manuelt elevforhold.mainSchool til false, da det finnes et automatisk elevforhold for samme skole - evt endringer på denne skolen for denne eleven må nå gjøres i FINT",
          student.name,
          enrollment.school.schoolNumber
        )
        return
      }
    })

    // Check if this i a new school - add it to updatedSchools if it doesn't exist already (AUTO if it comes from FINT, MANUAL if it for some weird reason doesn't)
    student.studentEnrollments.forEach((enrollment) => {
      if (!updatedSchools.some((school) => school.schoolNumber === enrollment.school.schoolNumber)) {
        updatedSchools.push({
          name: enrollment.school.name,
          schoolNumber: enrollment.school.schoolNumber,
          created: editorData,
          modified: editorData,
          source: fintSchools.some((fintSchool) => fintSchool.schoolNumber === enrollment.school.schoolNumber) ? "AUTO" : "MANUAL"
        })
      }
    })

    if (student.studentEnrollments.filter((enrollment) => enrollment.mainSchool).length > 1) {
      logger.warn("Fant flere enn ett elevforhold med mainSchool true for elev {StudentName} {FeideName} dette tror vi at ikke skal skje!", student.name, student.feideName)
    }

    // Set mainEnrollment to be the first enrollment with mainSchool true, or null
    student.mainEnrollment = student.studentEnrollments.find((enrollment) => enrollment.mainSchool) || null
  })

  logger.info("Ferdig med synk av elever og tilganger basert på FINT-data")
  return {
    updatedAppUsers,
    updatedStudents,
    updatedAccess,
    updatedSchools
  }
}
