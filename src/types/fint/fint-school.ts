import type { FintSkole } from "./fint-school-with-students.js"

export type FintSkoleInfo = Omit<FintSkole, "elevforhold">
