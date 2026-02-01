import type { FintSkole } from "./fint-school-with-students"

export type FintSkoleInfo = Omit<FintSkole, "elevforhold">
