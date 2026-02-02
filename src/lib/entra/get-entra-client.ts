import { MOCK_ENTRA } from "../../config.js"
import type { IEntraClient } from "../../types/entra/entra-client.js"
import { MockEntraClient } from "./mock-entra-client.js"

let entraClient: IEntraClient

if (MOCK_ENTRA) {
	entraClient = new MockEntraClient()
} else {
	throw new Error("No real entra client implemented yet.")
}

export const getEntraClient = (): IEntraClient => entraClient
