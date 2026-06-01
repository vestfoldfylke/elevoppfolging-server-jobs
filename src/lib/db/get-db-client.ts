import { logger } from "@vestfoldfylke/loglady"
import { type Binary, ClientEncryption, type ClientEncryptionEncryptOptions, MongoClient, type UUID } from "mongodb"
import { AZURE, MOCK_DB, MONGODB } from "../../config.js"
import type { IDbClient } from "../../types/db/db-client.js"
import { MockDbClient } from "./mock-db-client.js"
import { MongoDbClient } from "./mongodb-client.js"

let dbClient: IDbClient

if (MOCK_DB) {
  dbClient = new MockDbClient()
} else {
  if (!MONGODB.CONNECTION_STRING) {
    throw new Error("MONGODB_CONNECTION_STRING is not set (du har glemt den)")
  }
  if (!AZURE.TENANT_ID || !AZURE.CLIENT_ID || !AZURE.CLIENT_SECRET) {
    throw new Error("Azure credentials for client-side encryption is not fully set (du har glemt en av AZURE_TENANT_ID, AZURE_CLIENT_ID eller AZURE_CLIENT_SECRET)")
  }

  // Encryption settings
  const keyVaultNamespace = `${MONGODB.DB_NAME}.__keyVault`
  const kmsProviders = {
    azure: {
      tenantId: AZURE.TENANT_ID,
      clientId: AZURE.CLIENT_ID,
      clientSecret: AZURE.CLIENT_SECRET
    }
  }

  // Client with auto-encryption enabled
  const mongoEncryptionClient = new MongoClient(MONGODB.CONNECTION_STRING, {
    autoEncryption: {
      keyVaultNamespace: keyVaultNamespace,
      kmsProviders: kmsProviders,
      bypassAutoEncryption: true
    }
  })

  try {
    await mongoEncryptionClient.connect()
  } catch (error) {
    logger.errorException(error, "Error when connecting to MongoDB - check your configuration")
    await logger.flush()
    throw error
  }

  const dbWithEncryption = mongoEncryptionClient.db(MONGODB.DB_NAME)

  const encryptionClient = new ClientEncryption(mongoEncryptionClient, {
    keyVaultNamespace: keyVaultNamespace,
    kmsProviders: kmsProviders
  })

  let encryptionKeyIds: UUID[] = []
  try {
    encryptionKeyIds = (await encryptionClient.getKeys().toArray()).map((key) => key._id)
  } catch (error) {
    logger.errorException(error, "Error when fetching encryption keys from MongoDB, check your configuration")
    await logger.flush()
    throw error
  }

  const encryptValue = async (value: unknown): Promise<Binary> => {
    const encryptionOptions: ClientEncryptionEncryptOptions = {
      algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      keyId: encryptionKeyIds[Math.floor(Math.random() * encryptionKeyIds.length)] // Use a random key
    }
    return await encryptionClient.encrypt(value, encryptionOptions)
  }

  dbClient = new MongoDbClient(dbWithEncryption, encryptValue)
}

export const getDbClient = (): IDbClient => dbClient
