import { logger } from "@vestfoldfylke/loglady"
import { MongoDbEncryptionClient } from "../src/lib/db/mongodb-encryption-client.js"

logger.info("Starting script to get or create encryption keys...")

const keysToEnsure = ["key1", "key2", "key3"]

logger.info("Initializing MongoDbEncryptionClient...")
const encryptionClient = new MongoDbEncryptionClient()

logger.info("Fetching existing encryption keys...")
const existingKeys = await encryptionClient.getEncryptionKeys()

for (const keyAltName of keysToEnsure) {
  const existingKey = existingKeys.find((key) => key.keyAltNames?.includes(keyAltName))
  if (existingKey) {
    logger.info("Encryption key with alt name '{KeyAltName}' already exists with id {Id}. Skipping creation", keyAltName, existingKey._id.toString())
    continue
  }

  logger.info("No encryption key found with alt name '{KeyAltName}'. Creating new encryption key...", keyAltName)
  const newKeyId = await encryptionClient.createEncryptionKey([keyAltName])
  logger.info("Created new encryption key with alt name '{KeyAltName}' and id {NewKeyId}", keyAltName, newKeyId.toString())
}

logger.info("Fetching again for fun")

const allKeys = await encryptionClient.getEncryptionKeys()
logger.info(
  "All encryption keys in the system: '{@EncryptionKeys}",
  allKeys.map((key) => ({ id: key._id.toString(), altNames: key.keyAltNames }))
)

await encryptionClient.closeConnection()

logger.info("Finished script to get or create encryption keys.")
