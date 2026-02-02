import { MOCK_DB } from "../../config.js"
import type { IDbClient } from "../../types/db.js"
import { MockDbClient } from "./mock-db-client.js"
import { MongoDbClient } from "./mongo-db-client.js"

let dbClient: IDbClient

if (MOCK_DB) {
	dbClient = new MockDbClient()
} else {
	dbClient = new MongoDbClient()
}

export const getDbClient = (): IDbClient => dbClient
