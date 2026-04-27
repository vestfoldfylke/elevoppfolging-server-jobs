import { FintConfig } from "./types/fint/fint-client.js"

export const MOCK_FINT = process.env.MOCK_FINT === "true"

if (MOCK_FINT && !process.env.MOCK_FINT_DATA_PATH?.endsWith(".json")) {
  throw new Error("MOCK_FINT is set to true, but MOCK_FINT_DATA_PATH is not set to a valid .json file path")
}

export const APP_NAME = process.env.APP_NAME || "elevoppfolging-server-jobs"

export const MOCK_FINT_DATA_PATH = process.env.MOCK_FINT_DATA_PATH

export const MOCK_DB = process.env.MOCK_DB === "true"

export const MOCK_ENTRA = process.env.MOCK_ENTRA === "true"

export const FEIDENAME_SUFFIX = process.env.FEIDENAME_SUFFIX || "fylke.no"

export const MONGODB = {
  CONNECTION_STRING: process.env.MONGODB_CONNECTION_STRING || "",
  DB_NAME: process.env.MONGODB_DB_NAME || "elevoppfolging",
  COLLECTIONS: {
    STUDENTS: "students",
    USERS: "users",
    ACCESS: "access",
    DOCUMENTS: "documents",
    SCHOOLS: "schools"
  }
}

if (!MOCK_ENTRA && !process.env.FRONTEND_APP_REGISTRATION_ID) {
  throw new Error("FRONTEND_APP_REGISTRATION_ID must be set when not using MOCK_ENTRA")
}

export const FRONTEND_APP_REGISTRATION_ID = process.env.FRONTEND_APP_REGISTRATION_ID

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

  return {
    USERNAME: username,
    PASSWORD: password,
    CLIENT_ID: clientId,
    CLIENT_SECRET: clientSecret,
    SCOPE: process.env.FINT_SCOPE || "fint-client",
    TOKEN_URL: process.env.FINT_TOKEN_URL || "https://idp.felleskomponent.no/nidp/oauth/nam/token"
  }
}
