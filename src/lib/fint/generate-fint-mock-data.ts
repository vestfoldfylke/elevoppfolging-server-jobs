import { en, Faker, nb_NO } from "@faker-js/faker"
import { logger } from "@vestfoldfylke/loglady"
import type { GenerateMockFintSchoolsWithStudentsOptions } from "../../types/fint/fint-mock.js"
import type {
	FintElev,
	FintElevforhold,
	FintGyldighetsPeriode,
	FintKlasse,
	FintKontaktlarergruppe,
	FintSchoolWithStudents,
	FintUndervisningsforhold,
	FintUndervisningsgruppe
} from "../../types/fint/fint-school-with-students.js"

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

const generateUndervisningsforhold = (): FintUndervisningsforhold => {
	const uniqueName: UniqueName = generateUniqueName()
	return {
		systemId: {
			identifikatorverdi: norwegianFaker.string.uuid()
		},
		skoleressurs: {
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
}

const generateKlasse = (undervisningsforhold: FintUndervisningsforhold[]): FintKlasse => {
	const trinn: number = norwegianFaker.number.int({ min: 1, max: 2000 })
	return {
		navn: `${trinn}${norwegianFaker.helpers.arrayElement(["BAB", "STB", "TUT", "HAH", "JAU", "SUP"])}`,
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
		navn: `${norwegianFaker.helpers.arrayElement(["MATTE", "NORSK", "TUT", "HAH", "JAU", "SUP"])}${trinn}`,
		systemId: {
			identifikatorverdi: norwegianFaker.string.uuid()
		},
		undervisningsforhold: undervisningsforhold
	}
}

const generateKontaktlarergruppe = (undervisningsforhold: FintUndervisningsforhold[]): FintKontaktlarergruppe => {
	const trinn: number = norwegianFaker.number.int({ min: 1, max: 2000 })
	return {
		navn: `${trinn}${norwegianFaker.helpers.arrayElement(["BAB", "STB", "TUT", "HAH", "JAU", "SUP"])}`,
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

const generateSchool = (name: string): FintSchoolWithStudents => {
	return {
		skole: {
			skolenummer: {
				identifikatorverdi: norwegianFaker.string.numeric(8)
			},
			navn: name,
			elevforhold: []
		}
	}
}

export const generateMockFintSchoolsWithStudents = (config: GenerateMockFintSchoolsWithStudentsOptions): FintSchoolWithStudents[] => {
	if (config.schoolNames.length < 2) {
		throw new Error("At least two schools must be provided")
	}
	if (config.numberOfStudents < config.schoolNames.length) {
		throw new Error("Number of students must be at least equal to number of schools")
	}
	if (config.numberOfKlasser < 5 || config.numberOfKontaktlarergrupper < 5 || config.numberOfUndervisningsgrupper < 5 || config.numberOfUndervisningsforhold < 5 || config.numberOfStudents < 5) {
		throw new Error("All numeric configuration values must be at least 5")
	}

	const elevPool: FintElev[] = []
	for (let i = 0; i < config.numberOfStudents; i++) {
		elevPool.push(generateElev())
	}

	const schools: FintSchoolWithStudents[] = []
	config.schoolNames.forEach((schoolName, schoolIndex) => {
		const schoolToAdd: FintSchoolWithStudents = generateSchool(schoolName)

		const undervisningsforholdPool: FintUndervisningsforhold[] = []
		for (let i = 0; i < config.numberOfUndervisningsforhold; i++) {
			undervisningsforholdPool.push(generateUndervisningsforhold())
		}

		const klasserPool: FintKlasse[] = []
		for (let i = 0; i < config.numberOfKlasser; i++) {
			const undervisningsforhold = norwegianFaker.helpers.arrayElements(undervisningsforholdPool, { min: 1, max: 4 })
			klasserPool.push(generateKlasse(undervisningsforhold))
		}

		const undervisningsgrupperPool: FintUndervisningsgruppe[] = []
		for (let i = 0; i < config.numberOfUndervisningsgrupper; i++) {
			const undervisningsforhold = norwegianFaker.helpers.arrayElements(undervisningsforholdPool, { min: 1, max: 4 })
			undervisningsgrupperPool.push(generateUndervisningsgruppe(undervisningsforhold))
		}

		const kontaktlarergrupperPool: FintKontaktlarergruppe[] = []
		for (let i = 0; i < config.numberOfKontaktlarergrupper; i++) {
			const undervisningsforhold = norwegianFaker.helpers.arrayElements(undervisningsforholdPool, { min: 1, max: 4 })
			kontaktlarergrupperPool.push(generateKontaktlarergruppe(undervisningsforhold))
		}

		const elevforholdPool: FintElevforhold[] = []

		const skoleelever = norwegianFaker.helpers.arrayElements(elevPool, { min: 3, max: elevPool.length })

		if (schoolIndex > 0) {
			// Check if any of the skoleelever are already assigned to a previous school
			const alsoStudentAtPreviousSchool = skoleelever.find((elev) => {
				return schools[schoolIndex - 1].skole.elevforhold.some((ef) => ef.elev.systemId.identifikatorverdi === elev.systemId.identifikatorverdi)
			})
			if (!alsoStudentAtPreviousSchool) {
				logger.info(`Could not find cross-school-student. Adding cross-school student from ${schools[schoolIndex - 1].skole.navn} to ${schoolName}`)
				// If not, add one to ensure at least one student is also at a previous school
				skoleelever.push(norwegianFaker.helpers.arrayElement(schools[schoolIndex - 1].skole.elevforhold).elev)
			} else {
				logger.info(`Found cross-school-student for ${schoolName}`)
			}
		}

		skoleelever.forEach((elev, elevIndex) => {
			const klasse = norwegianFaker.helpers.arrayElements(klasserPool, { min: 1, max: 3 })
			const undervisningsgrupper = norwegianFaker.helpers.arrayElements(undervisningsgrupperPool, { min: 1, max: 8 })
			const kontaktlarergrupper = norwegianFaker.helpers.arrayElements(kontaktlarergrupperPool, { min: 1, max: 2 })
			// Make sure we have some variants of all periods
			if (elevIndex === 0) {
				const elevforhold = generateElevforhold(elev, klasse, undervisningsgrupper, kontaktlarergrupper)
				elevforhold.gyldighetsperiode = validPeriod
				elevforhold.klassemedlemskap[0].gyldighetsperiode = expiredPeriod
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
			elevforholdPool.push(generateElevforhold(elev, klasse, undervisningsgrupper, kontaktlarergrupper))
		})

		schoolToAdd.skole.elevforhold = elevforholdPool

		schools.push(schoolToAdd)
	})

	return schools
}
