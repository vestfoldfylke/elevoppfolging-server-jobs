import { logger } from "@vestfoldfylke/loglady";
import { MongoDbEncryptionClient } from "../src/lib/db/mongodb-encryption-client.js";

logger.info("Starting script to get or create encryption keys...");

logger.info("Initializing MongoDbEncryptionClient...");
const encryptionClient = new MongoDbEncryptionClient();

logger.info("Re-wrapping existing encryption keys")

try {
  await encryptionClient.rewrapEncryptionKeys()
  logger.info("Finished re-wrapping encryption keys successfully.")
} catch (error) {
  logger.errorException(error, "Error when re-wrapping encryption keys")
}

await encryptionClient.closeConnection()

logger.info("Finished script to get or create encryption keys.")