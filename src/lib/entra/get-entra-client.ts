import { MOCK_ENTRA } from "../../config.js"
import type { IEntraClient } from "../../types/entra/entra-client.js"
import { EntraClient } from "./entra-client.js"
import { MockEntraClient } from "./mock-entra-client.js"

let entraClient: IEntraClient

if (MOCK_ENTRA) {
	entraClient = new MockEntraClient()
} else {
	entraClient = new EntraClient()
}

export const getEntraClient = (): IEntraClient => entraClient
