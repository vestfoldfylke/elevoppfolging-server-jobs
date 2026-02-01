import { MOCK_DB } from "../../../config"
import type { IDbClient } from "../../types/db"
import { MockDbClient } from "./mock-db-client"

let dbClient: IDbClient

if (MOCK_DB) {
	dbClient = new MockDbClient()
} else {
	throw new Error("No real database client implemented yet.")
}

export const getDbClient = (): IDbClient => dbClient
