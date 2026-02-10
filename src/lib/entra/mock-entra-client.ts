import type { User } from "@microsoft/microsoft-graph-types"
import type { IEntraClient } from "../../types/entra/entra-client.js"

export class MockEntraClient implements IEntraClient {
	async getEnterpriseApplicationUsers(): Promise<User[]> {
		return [
			{
				id: "1",
				accountEnabled: true,
				companyName: "kbdfj",
				displayName: "sorgi",
				onPremisesSamAccountName: "jeg-skal-bli-oppdatert",
				mail: "fg",
				userPrincipalName: "rty"
			},
			{
				id: "2",
				accountEnabled: true,
				companyName: "kbdfj",
				displayName: "dorgi",
				onPremisesSamAccountName: "jeg-skal-bli-oppdatert-også",
				mail: "fg",
				userPrincipalName: "etannetupn"
			}
		]
	}
}
