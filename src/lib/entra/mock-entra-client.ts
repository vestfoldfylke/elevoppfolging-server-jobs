import type { User } from "@microsoft/microsoft-graph-types"
import type { IEntraClient } from "../../types/entra/entra-client.js"

export class MockEntraClient implements IEntraClient {
	async getEnterpriseApplicationUsers(): Promise<User[]> {
		return [
			{
				id: "1",
				companyName: "kbdfj",
				displayName: "sorgi",
				onPremisesSamAccountName: "we",
				mail: "fg",
				onPremisesExtensionAttributes: {
					extensionAttribute9: "erg"
				},
				userPrincipalName: "rty"
			}
		]
	}
}
