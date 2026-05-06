import type { FintSkole } from "./fint-school-with-students.js"

export type FintSkoleInfo = Omit<FintSkole, "elevforhold">

export type FintSkolerRest = {
  _embedded: {
    _entries: FintSkoleInfo[]
  }
}
