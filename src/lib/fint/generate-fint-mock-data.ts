import { en, Faker, nb_NO } from "@faker-js/faker"
import { logger } from "@vestfoldfylke/loglady"
import { FINT_ADDRESS_BLOCK } from "../../config.js"
import type { GenerateMockFintSchoolsWithStudentsOptions, MockFintSchool } from "../../types/fint/fint-mock.js"
import type {
  FintElev,
  FintElevforhold,
  FintGyldighetsPeriode,
  FintKlasse,
  FintKontaktlarergruppe,
  FintSchoolWithStudents,
  FintSkoleressurs,
  FintUndervisningsforhold,
  FintUndervisningsgruppe
} from "../../types/fint/fint-school-with-students.js"
import { getUniqueStudents } from "./utils.js"

export const norwegianFaker = new Faker({
  locale: [nb_NO, en]
})

const validPeriod: FintGyldighetsPeriode = {
  start: "2022-08-15T00:00:00Z",
  slutt: null
}

const expiredPeriod: FintGyldighetsPeriode = {
  start: "2020-08-15T00:00:00Z",
  slutt: "2022-08-15T00:00:00Z"
}

const futurePeriod: FintGyldighetsPeriode = {
  start: "2123-08-15T00:00:00Z",
  slutt: null
}

const generatedNames: Record<string, boolean> = {}

type UniqueName = {
  firstName: string
  lastName: string
  feidePrefix: string
}

const generateUniqueName = (): UniqueName => {
  let randomName = norwegianFaker.person.fullName()
  const maxAttempts = 10000
  let attempts = 0
  while (randomName in generatedNames || randomName.split(" ").length < 2) {
    attempts++
    if (attempts >= maxAttempts) {
      throw new Error(`Unable to generate a unique name after maximum attempts: ${maxAttempts}`)
    }
    randomName = norwegianFaker.person.fullName()
  }
  const firstName: string = randomName.substring(0, randomName.lastIndexOf(" "))
  const lastName: string = randomName.substring(randomName.lastIndexOf(" ") + 1)
  const feidePrefix: string = randomName.toLowerCase().replaceAll(" ", ".")
  generatedNames[randomName] = true

  return { firstName, lastName, feidePrefix }
}

const generateAddress = (): { adresselinje: Array<string | null> } | null => {
  const randomNumber: number = norwegianFaker.number.int({ max: 1000 })

  // student with blocked address
  if ([42, 69, 666, 777].includes(randomNumber)) {
    return {
      adresselinje: [FINT_ADDRESS_BLOCK]
    }
  }

  // student with no address at all
  if ([43, 70, 667, 778].includes(randomNumber)) {
    return null
  }

  // student with a single non-existing address
  if ([41, 68, 665, 776].includes(randomNumber)) {
    return {
      adresselinje: [null]
    }
  }

  return {
    adresselinje: [norwegianFaker.location.streetAddress(false)]
  }
}

const generateSkoleressurs = (): FintSkoleressurs => {
  const uniqueName: UniqueName = generateUniqueName()
  return {
    systemId: {
      identifikatorverdi: norwegianFaker.string.uuid()
    },
    feidenavn: {
      identifikatorverdi: `${uniqueName.feidePrefix}@fylke.no`
    },
    person: {
      navn: {
        fornavn: uniqueName.firstName,
        etternavn: uniqueName.lastName
      }
    }
  }
}

const generateUndervisningsforhold = (skoleressurs: FintSkoleressurs): FintUndervisningsforhold => {
  return {
    systemId: {
      identifikatorverdi: norwegianFaker.string.uuid()
    },
    skoleressurs: skoleressurs
  }
}

const classGroupNames = ["BAB", "STB", "TUT", "HAH", "JAU", "SUP"]

const generateKlasse = (undervisningsforhold: FintUndervisningsforhold[]): FintKlasse => {
  const trinn: number = norwegianFaker.number.int({ min: 1, max: 2000 })
  return {
    navn: `${trinn}${norwegianFaker.helpers.arrayElement(classGroupNames)}`,
    systemId: {
      identifikatorverdi: norwegianFaker.string.uuid()
    },
    trinn: {
      navn: `VG${trinn}`,
      grepreferanse: ["VGS"]
    },
    undervisningsforhold: undervisningsforhold
  }
}

const generateUndervisningsgruppe = (undervisningsforhold: FintUndervisningsforhold[]): FintUndervisningsgruppe => {
  const trinn: number = norwegianFaker.number.int({ min: 1, max: 2000 })
  return {
    navn: `${norwegianFaker.helpers.arrayElement(["MAT", "NOR", "SAMF", "GYM", "GEO", "LØK"])}${trinn}`,
    systemId: {
      identifikatorverdi: norwegianFaker.string.uuid()
    },
    undervisningsforhold: undervisningsforhold
  }
}

const generateKontaktlarergruppe = (undervisningsforhold: FintUndervisningsforhold[]): FintKontaktlarergruppe => {
  const trinn: number = norwegianFaker.number.int({ min: 1, max: 2000 })
  return {
    navn: `${trinn}${norwegianFaker.helpers.arrayElement(classGroupNames)}`,
    systemId: {
      identifikatorverdi: norwegianFaker.string.uuid()
    },
    undervisningsforhold: undervisningsforhold
  }
}

const generateElev = (): FintElev => {
  const uniqueName: UniqueName = generateUniqueName()
  return {
    systemId: {
      identifikatorverdi: norwegianFaker.string.uuid()
    },
    elevnummer: {
      identifikatorverdi: norwegianFaker.string.numeric(5)
    },
    feidenavn: {
      identifikatorverdi: `${uniqueName.feidePrefix}@fylke.no`
    },
    person: {
      bostedsadresse: generateAddress(),
      navn: {
        fornavn: uniqueName.firstName,
        etternavn: uniqueName.lastName
      },
      fodselsnummer: {
        identifikatorverdi: uniqueName.feidePrefix
      }
    }
  }
}

const lottoPeriods = [validPeriod, validPeriod, validPeriod, validPeriod, validPeriod, validPeriod, expiredPeriod, futurePeriod]

const generateElevforhold = (elev: FintElev, klasse: FintKlasse[], undervisningsgrupper: FintUndervisningsgruppe[], kontaktlarergrupper: FintKontaktlarergruppe[]): FintElevforhold => {
  return {
    elev: elev,
    hovedskole: true,
    systemId: {
      identifikatorverdi: norwegianFaker.string.uuid()
    },
    gyldighetsperiode: norwegianFaker.helpers.arrayElement(lottoPeriods),
    klassemedlemskap: klasse.map((k) => ({
      systemId: {
        identifikatorverdi: norwegianFaker.string.uuid()
      },
      gyldighetsperiode: norwegianFaker.helpers.arrayElement(lottoPeriods),
      klasse: k
    })),
    undervisningsgruppemedlemskap: undervisningsgrupper.map((ug) => ({
      systemId: {
        identifikatorverdi: norwegianFaker.string.uuid()
      },
      gyldighetsperiode: norwegianFaker.helpers.arrayElement(lottoPeriods),
      undervisningsgruppe: ug
    })),
    kontaktlarergruppemedlemskap: kontaktlarergrupper.map((kg) => ({
      systemId: {
        identifikatorverdi: norwegianFaker.string.uuid()
      },
      gyldighetsperiode: norwegianFaker.helpers.arrayElement(lottoPeriods),
      kontaktlarergruppe: kg
    }))
  }
}

const generateSchool = (school: MockFintSchool): FintSchoolWithStudents => {
  return {
    skole: {
      skolenummer: {
        identifikatorverdi: school.schoolNumber
      },
      navn: school.name,
      elevforhold: []
    }
  }
}

export const generateMockFintSchoolsWithStudents = (config: GenerateMockFintSchoolsWithStudentsOptions): FintSchoolWithStudents[] => {
  if (config.schools.length < 2) {
    throw new Error("At least two schools must be provided")
  }
  if (config.numberOfStudents < config.schools.length) {
    throw new Error("Number of students must be at least equal to number of schools")
  }
  if (config.numberOfKlasser < 5 || config.numberOfKontaktlarergrupper < 5 || config.numberOfUndervisningsgrupper < 5 || config.numberOfTeachers < 5 || config.numberOfStudents < 5) {
    throw new Error("All numeric configuration values must be at least 5")
  }

  const elevPool: FintElev[] = []
  for (let i = 0; i < config.numberOfStudents; i++) {
    elevPool.push(generateElev())
  }

  const elevOnEverySchool = generateElev()

  logger.warn(
    `This poor bastard should be attending every school: ${elevOnEverySchool.feidenavn?.identifikatorverdi} (${elevOnEverySchool.person.navn.fornavn} ${elevOnEverySchool.person.navn.etternavn})`
  )

  const skoleressursPool: FintSkoleressurs[] = []
  for (let i = 0; i < config.numberOfTeachers; i++) {
    skoleressursPool.push(generateSkoleressurs())
  }

  logger.warn("This poor bastard should be working at every school: {FeideName}", skoleressursPool[0].feidenavn?.identifikatorverdi)

  const schools: FintSchoolWithStudents[] = []
  config.schools.forEach((school: MockFintSchool, schoolIndex: number) => {
    const schoolToAdd: FintSchoolWithStudents = generateSchool(school)

    const undervisningsforholdPool: FintUndervisningsforhold[] = []
    for (let i = 0; i < config.numberOfTeachers; i++) {
      if (i === 0) {
        // Ensure at least one skoleressurs is used multiple times
        undervisningsforholdPool.push(generateUndervisningsforhold(skoleressursPool[0]))
        continue
      }
      const skoleressurs = norwegianFaker.helpers.arrayElement(skoleressursPool)
      undervisningsforholdPool.push(generateUndervisningsforhold(skoleressurs))
    }

    const klasserPool: FintKlasse[] = []
    for (let i = 0; i < config.numberOfKlasser; i++) {
      if (i === 0) {
        // Ensure at least one undervisningsforhold is used multiple times
        const undervisningsforhold = [undervisningsforholdPool[0]]
        klasserPool.push(generateKlasse(undervisningsforhold))
        continue
      }
      const undervisningsforhold = norwegianFaker.helpers.arrayElements(undervisningsforholdPool, { min: 1, max: 4 })
      klasserPool.push(generateKlasse(undervisningsforhold))
    }

    const undervisningsgrupperPool: FintUndervisningsgruppe[] = []
    for (let i = 0; i < config.numberOfUndervisningsgrupper; i++) {
      // Ensure at least one undervisningsforhold is used multiple times
      if (i === 0) {
        const undervisningsforhold = [undervisningsforholdPool[0]]
        undervisningsgrupperPool.push(generateUndervisningsgruppe(undervisningsforhold))
        continue
      }
      const undervisningsforhold = norwegianFaker.helpers.arrayElements(undervisningsforholdPool, { min: 1, max: 4 })
      undervisningsgrupperPool.push(generateUndervisningsgruppe(undervisningsforhold))
    }

    const kontaktlarergrupperPool: FintKontaktlarergruppe[] = []
    for (let i = 0; i < config.numberOfKontaktlarergrupper; i++) {
      // Ensure at least one undervisningsforhold is used multiple times
      if (i === 0) {
        const undervisningsforhold = [undervisningsforholdPool[0]]
        kontaktlarergrupperPool.push(generateKontaktlarergruppe(undervisningsforhold))
        continue
      }
      const undervisningsforhold = norwegianFaker.helpers.arrayElements(undervisningsforholdPool, { min: 1, max: 4 })
      kontaktlarergrupperPool.push(generateKontaktlarergruppe(undervisningsforhold))
    }

    const elevforholdPool: FintElevforhold[] = []

    const skoleelever = norwegianFaker.helpers.arrayElements(elevPool, { min: 3, max: elevPool.length })

    if (schoolIndex > 0) {
      const prevSchool = schools[schoolIndex - 1]
      const prevSchoolElevforhold = prevSchool.skole?.elevforhold || []
      // Check if any of the skoleelever are already assigned to a previous school
      const alsoStudentAtPreviousSchool = skoleelever.find((elev) => {
        return prevSchoolElevforhold.some((ef) => ef?.elev.systemId.identifikatorverdi === elev.systemId.identifikatorverdi)
      })
      if (!alsoStudentAtPreviousSchool) {
        logger.info("Could not find cross-school-student. Adding cross-school student from {PreviousSchoolName} to {SchoolName}", prevSchool.skole?.navn, school.name)
        // If not, add one to ensure at least one student is also at a previous school
        skoleelever.push(norwegianFaker.helpers.arrayElement(prevSchoolElevforhold.filter((ef) => ef !== null)).elev)
      } else {
        logger.info("Found cross-school-student for {SchoolName}", school.name)
      }
    }

    elevforholdPool.push(generateElevforhold(elevOnEverySchool, [klasserPool[0]], [undervisningsgrupperPool[0]], [kontaktlarergrupperPool[0]]))

    skoleelever.forEach((elev, elevIndex) => {
      const klasse = norwegianFaker.helpers.arrayElements(klasserPool, { min: 1, max: 3 })
      const undervisningsgrupper = norwegianFaker.helpers.arrayElements(undervisningsgrupperPool, { min: 1, max: 8 })
      const kontaktlarergrupper = norwegianFaker.helpers.arrayElements(kontaktlarergrupperPool, { min: 1, max: 2 })
      // Make sure we have some variants of all periods
      if (elevIndex === 0) {
        const elevforhold = generateElevforhold(elev, klasse, undervisningsgrupper, kontaktlarergrupper)
        elevforhold.gyldighetsperiode = validPeriod
        // @ts-expect-error - we know its there
        elevforhold.klassemedlemskap[0].gyldighetsperiode = expiredPeriod
        // @ts-expect-error - we know its there
        elevforhold.undervisningsgruppemedlemskap[0].gyldighetsperiode = futurePeriod
        elevforholdPool.push(elevforhold)
        return
      }
      if (elevIndex === 1) {
        const elevforhold = generateElevforhold(elev, klasse, undervisningsgrupper, kontaktlarergrupper)
        elevforhold.gyldighetsperiode = expiredPeriod
        elevforholdPool.push(elevforhold)
        return
      }
      if (elevIndex === 2) {
        const elevforhold = generateElevforhold(elev, klasse, undervisningsgrupper, kontaktlarergrupper)
        elevforhold.gyldighetsperiode = futurePeriod
        elevforholdPool.push(elevforhold)
        return
      }
      // Make sure the poor teacher has at least one student in all schools
      if (elevIndex === 3) {
        const elevforhold = generateElevforhold(elev, [klasserPool[0]], [undervisningsgrupperPool[0]], [kontaktlarergrupperPool[0]])
        elevforholdPool.push(elevforhold)
        return
      }
      elevforholdPool.push(generateElevforhold(elev, klasse, undervisningsgrupper, kontaktlarergrupper))
    })

    if (schoolToAdd.skole) {
      schoolToAdd.skole.elevforhold = elevforholdPool

      schools.push(schoolToAdd)
    } else {
      logger.error("Fikk ikke skole-data for skole {@School}, hopper over", schoolToAdd)
    }
  })

  let studentsWithAddressBlock: FintElev[] = getUniqueStudents(schools, (student: FintElev) => student.person.bostedsadresse?.adresselinje?.includes(FINT_ADDRESS_BLOCK))

  if (studentsWithAddressBlock.length < config.minimumNumberOfStudentsWithBlockedAddress) {
    for (let i: number = 0; i < config.minimumNumberOfStudentsWithBlockedAddress - studentsWithAddressBlock.length; i++) {
      let randomStudent: FintElev = schools[norwegianFaker.number.int({ min: 0, max: schools.length - 1 })].skole?.elevforhold?.[
        norwegianFaker.number.int({ min: 0, max: config.numberOfStudents - 1 })
      ]?.elev as FintElev

      while (!randomStudent || randomStudent.person.bostedsadresse?.adresselinje?.includes(FINT_ADDRESS_BLOCK)) {
        randomStudent = schools[norwegianFaker.number.int({ min: 0, max: schools.length - 1 })].skole?.elevforhold?.[norwegianFaker.number.int({ min: 0, max: config.numberOfStudents - 1 })]
          ?.elev as FintElev
      }

      randomStudent.person.bostedsadresse = {
        adresselinje: [FINT_ADDRESS_BLOCK]
      }
    }

    studentsWithAddressBlock = getUniqueStudents(schools, (student: FintElev) => student.person.bostedsadresse?.adresselinje?.includes(FINT_ADDRESS_BLOCK))
  }

  const numberOfStudentsWithNoAddress: number = getUniqueStudents(schools, (elev: FintElev) => elev.person.bostedsadresse === null).length
  const numberOfStudentsWithNullAddress: number = getUniqueStudents(schools, (elev: FintElev) => elev.person.bostedsadresse?.adresselinje?.includes(null)).length
  const numberOfStudentsWithNonBlockedAddress: number = getUniqueStudents(
    schools,
    (elev: FintElev) => Array.isArray(elev.person.bostedsadresse?.adresselinje) && elev.person.bostedsadresse?.adresselinje.length > 0
  ).length

  logger.info(
    "There are currently {StudentsWithAddressBlockCount} students with address block (for instance this student with feidenavn '{StudentWithAddressBlockFeideName}'), {StudentsWithNoAddressCount} students with no address, {StudentsWithNullAddressCount} students with null address and {StudentsWithNonBlockedAddressCount} students with non-blocked addresses in the generated data",
    studentsWithAddressBlock.length,
    studentsWithAddressBlock.length > 0 ? studentsWithAddressBlock[0].feidenavn?.identifikatorverdi : "N/A",
    numberOfStudentsWithNoAddress,
    numberOfStudentsWithNullAddress,
    numberOfStudentsWithNonBlockedAddress
  )

  return schools
}

/*

- Når vi oppdaterer brukere - må vi plukke alle fra enterprise-app og slenge de inn som brukere i basen.
- Hvis MOCK, så kan vi også knytte opp enterprise brukerne (som har tilgang i mock) til noen random lærere

*/
