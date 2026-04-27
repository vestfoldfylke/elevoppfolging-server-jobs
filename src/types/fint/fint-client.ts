import type { FintSkoleInfo } from "./fint-school.js"
import type { FintSchoolWithStudents } from "./fint-school-with-students.js"

export interface IFintClient {
  /** Henter alle elever fra FINT APIet */
  getSchools: () => Promise<FintSkoleInfo[]>
  getSchoolWithStudents: (schoolNumber: string) => Promise<FintSchoolWithStudents>
}

export type FintConfig = {
  USERNAME: string
  PASSWORD: string
  CLIENT_ID: string
  CLIENT_SECRET: string
  SCOPE: string
  TOKEN_URL: string
}

export type FintAccessTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  acr: string
  scope: string
}
