import type { FintSkoleInfo } from "./fint-school.js"
import type { FintSchoolWithStudents } from "./fint-school-with-students.js"

export interface IFintClient {
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
  API_URL: string
  VERSION: string
}

export type FintAccessTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  acr: string
  scope: string
}

export type FintGraphQlResponse<T> = {
  errors?: Array<unknown>
  data: T
}
