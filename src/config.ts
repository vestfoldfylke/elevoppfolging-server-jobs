export const MOCK_FINT = process.env.MOCK_FINT === "true"

if (MOCK_FINT && (!process.env.MOCK_FINT_DATA_PATH || !process.env.MOCK_FINT_DATA_PATH.endsWith(".json"))) {
  throw new Error("MOCK_FINT is set to true, but MOCK_FINT_DATA_PATH is not set to a valid .json file path")
}

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
    DOCUMENTS: "documents"
  }
}

if (!MOCK_ENTRA && !process.env.FRONTEND_APP_REGISTRATION_ID) {
  throw new Error("FRONTEND_APP_REGISTRATION_ID must be set when not using MOCK_ENTRA")
}

export const FRONTEND_APP_REGISTRATION_ID = process.env.FRONTEND_APP_REGISTRATION_ID
