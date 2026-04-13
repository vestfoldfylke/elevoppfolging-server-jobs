import { logger } from "@vestfoldfylke/loglady"
import { ClientEncryption, DataKey, type Db,MongoClient, UUID } from "mongodb"

export class MongoDbEncryptionClient {
  private readonly mongoClient: MongoClient
  private encryptionClient: ClientEncryption | null = null
  private readonly keyVaultCollectionName = "__keyVault"
  private readonly keyVaultNamespace
  private readonly kmsProviders: { azure: { tenantId: string; clientId: string; clientSecret: string } }
  private readonly masterKey: { keyVaultEndpoint: string; keyName: string; keyVersion: string }
  private db: Db | null = null
  private readonly dbName: string

  constructor() {
    if (!process.env.MONGODB_CONNECTION_STRING) {
      throw new Error("MONGODB_CONNECTION_STRING is not set (du har glemt den)")
    }
    if (!process.env.MONGODB_DB_NAME) {
      throw new Error("MONGODB_DB_NAME is not set (du har glemt den)")
    }
    if (!process.env.AZURE_TENANT_ID || !process.env.AZURE_CLIENT_ID || !process.env.AZURE_CLIENT_SECRET) {
      throw new Error("Azure credentials for client-side encryption is not fully set (du har glemt en av AZURE_TENANT_ID, AZURE_CLIENT_ID eller AZURE_CLIENT_SECRET)") 
    }
    if (!process.env.AZURE_KEY_VAULT_ENDPOINT || !process.env.AZURE_MASTER_KEY_NAME || !process.env.AZURE_MASTER_KEY_VERSION) {
      throw new Error("Azure Key Vault details for client-side encryption is not fully set (du har glemt en av AZURE_KEY_VAULT_ENDPOINT, AZURE_MASTER_KEY_NAME eller AZURE_MASTER_KEY_VERSION)")
    }

    this.dbName = process.env.MONGODB_DB_NAME

    this.mongoClient = new MongoClient(process.env.MONGODB_CONNECTION_STRING)

    this.keyVaultNamespace = `${this.dbName}.${this.keyVaultCollectionName}`
    this.kmsProviders = {
      azure: {
        tenantId: process.env.AZURE_TENANT_ID,
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET
      }
    }
    this.masterKey = {
      keyVaultEndpoint: process.env.AZURE_KEY_VAULT_ENDPOINT,
      keyName: process.env.AZURE_MASTER_KEY_NAME,
      keyVersion: process.env.AZURE_MASTER_KEY_VERSION
    }
  }

  private async getDb(): Promise<Db> {
    if (this.db) {
      return this.db
    }
    try {
      await this.mongoClient.connect()
      this.db = this.mongoClient.db(this.dbName)
      return this.db
    } catch (error) {
      logger.errorException(error, "Error when connecting to MongoDB")
      throw error
    }
  }

  private async getEncryptionClient(): Promise<ClientEncryption> {
    if (this.encryptionClient) {
      return this.encryptionClient
    }

    // Must ensure connect
    await this.getDb()

    try {
      this.encryptionClient = new ClientEncryption(this.mongoClient, {
        keyVaultNamespace: this.keyVaultNamespace,
        kmsProviders: this.kmsProviders
      })

      return this.encryptionClient
    } catch (error) {
      logger.errorException(error, "Error when creating ClientEncryption instance")
      throw error
    }
  }

  async closeConnection(): Promise<void> {
    try {
      await this.mongoClient.close()
      logger.info("MongoDB connection closed successfully.")
    } catch (error) {
      logger.errorException(error, "Error when closing MongoDB connection")
    }
  }

  async createEncryptionKey(keyAltNames: string[]): Promise<UUID> {
    const db = await this.getDb()
    const keyvaultCollection = db.collection(this.keyVaultCollectionName)

    // Ensure index on keyAltNames
    await keyvaultCollection.createIndex({ keyAltNames: 1 }, { unique: true, partialFilterExpression: { keyAltNames: { $exists: true } } })

    const encryptionClient = await this.getEncryptionClient()
    const encryptionKeyId = await encryptionClient.createDataKey('azure', {
      masterKey: this.masterKey,
      keyAltNames
    })
    return encryptionKeyId
  }

  async getEncryptionKeys(): Promise<DataKey[]> {
    const encryptionClient = await this.getEncryptionClient()
    return await encryptionClient.getKeys().toArray()
  }

  async rewrapEncryptionKeys(): Promise<void> {
    const encryptionClient = await this.getEncryptionClient()
    const result = await encryptionClient.rewrapManyDataKey({},
    {
      provider: "azure",
      masterKey: this.masterKey
    })

    if (result.bulkWriteResult != null) {
      console.log(`Keys were re-wrapped. Details: ${JSON.stringify(result.bulkWriteResult)}`);
      return
    }
    console.log("No keys matched the filter, no bulk write performed.");
  }
}
