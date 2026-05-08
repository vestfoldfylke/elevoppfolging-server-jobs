import type { FintElev, FintElevforhold, FintSchoolWithStudents } from "../../types/fint/fint-school-with-students.js"

export const getUniqueStudents = (schools: FintSchoolWithStudents[], studentFunction: (student: FintElev) => boolean | undefined): FintElev[] => {
  const uniqueStudents = new Map<string, FintElev>()

  schools.forEach((school: FintSchoolWithStudents) => {
    if (!Array.isArray(school.skole?.elevforhold)) {
      return
    }

    school.skole.elevforhold.forEach((elevforhold: FintElevforhold | null) => {
      if (elevforhold?.elev && studentFunction(elevforhold.elev)) {
        uniqueStudents.set(elevforhold.elev.systemId.identifikatorverdi, elevforhold.elev)
      }
    })
  })

  return Array.from(uniqueStudents.values())
}
