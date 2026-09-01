import type { FintConfig } from "./types/fint/fint-client.js"
import type { SmtpConfig } from "./types/smtp/smtp-client.js"

const getFintVersion = (): string => `V${process.env.FINT_VERSION || "4"}`

export const MOCK_FINT = process.env.MOCK_FINT === "true"

export const FINT_VERSION: string = getFintVersion()

export const APP_NAME = process.env.APP_NAME || "elevoppfolging-server-jobs"

export const MOCK_FINT_DATA_PATH = process.env.MOCK_FINT_DATA_PATH

export const MOCK_DB = process.env.MOCK_DB === "true"

export const MOCK_ENTRA = process.env.MOCK_ENTRA === "true"

export const MOCK_SMTP = process.env.MOCK_SMTP === "true"

export const FEIDENAME_SUFFIX = process.env.FEIDENAME_SUFFIX || "fylke.no"

export const MONGODB = {
  CONNECTION_STRING: process.env.MONGODB_CONNECTION_STRING || "",
  DB_NAME: process.env.MONGODB_DB_NAME || "elevoppfolging",
  COLLECTIONS: {
    STUDENTS: "students",
    IMPORTANT_STUFF: "important-stuff",
    USERS: "users",
    ACCESS: "access",
    DOCUMENTS: "documents",
    STUDENT_DATA_SHARING_CONSENT: "student-data-sharing-consents",
    SCHOOLS: "schools",
    EMAIL_ALERTS: "email-alerts"
  }
}

if (!MOCK_ENTRA && !process.env.FRONTEND_APP_CLIENT_ID) {
  throw new Error("FRONTEND_APP_CLIENT_ID must be set when not using MOCK_ENTRA")
}

export const FRONTEND_APP_CLIENT_ID = process.env.FRONTEND_APP_CLIENT_ID

export const AZURE = {
  CLIENT_ID: process.env.AZURE_CLIENT_ID,
  CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
  TENANT_ID: process.env.AZURE_TENANT_ID
}

export const getFintConfig = (): FintConfig => {
  const username: string | undefined = process.env.FINT_USERNAME
  if (!username) {
    throw new Error("FINT_USERNAME must be set to a valid FINT client username")
  }

  const password: string | undefined = process.env.FINT_PASSWORD
  if (!password) {
    throw new Error("FINT_PASSWORD must be set to a valid FINT client password")
  }

  const clientId: string | undefined = process.env.FINT_CLIENT_ID
  if (!clientId) {
    throw new Error("FINT_CLIENT_ID must be set to a valid FINT client client id")
  }

  const clientSecret: string | undefined = process.env.FINT_CLIENT_SECRET
  if (!clientSecret) {
    throw new Error("FINT_CLIENT_SECRET must be set to a valid FINT client secret")
  }

  const schoolNumbersToSkip: string = process.env.FINT_SKIP_SCHOOL_NUMBERS || ""

  return {
    USERNAME: username,
    PASSWORD: password,
    CLIENT_ID: clientId,
    CLIENT_SECRET: clientSecret,
    SCOPE: process.env.FINT_SCOPE || "fint-client",
    TOKEN_URL: process.env.FINT_TOKEN_URL || "https://idp.felleskomponent.no/nidp/oauth/nam/token",
    API_URL: process.env.FINT_API_URL || "https://api.felleskomponent.no",
    VERSION: getFintVersion(),
    SCHOOL_NUMBERS_TO_SKIP: schoolNumbersToSkip.trim().split(",")
  }
}

export const FINT_ADDRESS_BLOCK_ADDRESSES: string[] = (process.env.FINT_ADDRESS_BLOCK || "FORTROLIG ADRESSE,STRENGT FORTROLIG ADRESSE").split(",")

export const getSmtpConfig = (): SmtpConfig => {
  const baseUrl: string | undefined = process.env.SMTP_BASE_URL
  if (!baseUrl) {
    throw new Error("SMTP_BASE_URL must be set to a valid SMTP API base URL")
  }

  const apiKey: string | undefined = process.env.SMTP_API_KEY
  if (!apiKey) {
    throw new Error("SMTP_API_KEY must be set to a valid API key")
  }

  const fromAddress: string | undefined = process.env.SMTP_FROM_ADDRESS
  if (!fromAddress) {
    throw new Error("SMTP_FROM_ADDRESS must be set to a valid email address")
  }

  return {
    baseUrl,
    apiKey,
    fromAddress
  }
}
