import { DefaultAzureCredential } from "@azure/identity"
import type { AppRoleAssignment, PublicError, User } from "@microsoft/microsoft-graph-types"
import { logger } from "@vestfoldfylke/loglady"
import { FRONTEND_APP_REGISTRATION_ID } from "../../config.js"
import type { IEntraClient } from "../../types/entra/entra-client.js"

export class EntraClient implements IEntraClient {
  private defaultAzureCredential: DefaultAzureCredential
  private graphScope: string

  constructor() {
    this.defaultAzureCredential = new DefaultAzureCredential({})
    this.graphScope = "https://graph.microsoft.com/.default"
  }

  private async graphGet<T>(endpoint: string): Promise<T> {
    const accessToken = await this.defaultAzureCredential.getToken(this.graphScope)
    const response = await fetch(`https://graph.microsoft.com/v1.0/${endpoint}`, { headers: { Authorization: `Bearer ${accessToken?.token}` } })

    if (!response.ok) {
      const errorData = (await response.json()) as PublicError
      logger.error("Graph API GET request to endpoint '{endpoint}' failed with status {status} {statusText} - {@errorData}", endpoint, response.status, response.statusText, errorData)
      throw new Error(`Failed to GET '${endpoint}' : ${response.status} ${response.statusText}`)
    }

    let result = await response.json()
    if (!result) {
      logger.error("Graph API GET request to endpoint '{endpoint}' returned no data", endpoint)
      throw new Error(`Graph API GET request to endpoint '${endpoint}' returned no data`)
    }
    if (!("@odata.nextLink" in result)) {
      if (Array.isArray(result.value)) {
        return result.value as T
      }
      return result as T
    }

    if (!("value" in result)) {
      logger.error("Graph API GET request to endpoint '{endpoint}' returned paginated data but no 'value' property", endpoint)
      throw new Error(`Graph API GET request to endpoint '${endpoint}' returned paginated data but no 'value' property`)
    }

    const paginatedResult = [...result.value]
    while (result["@odata.nextLink"]) {
      logger.info("Graph API GET request to endpoint '{endpoint}' has more data, fetching next page", endpoint)
      const nextLink = result["@odata.nextLink"]
      const nextResponse = await fetch(nextLink, { headers: { Authorization: `Bearer ${accessToken?.token}` } })
      if (!nextResponse.ok) {
        const errorData = (await nextResponse.json()) as PublicError
        logger.error(
          "Graph API GET request to endpoint '{endpoint}' failed during pagination with status {status} {statusText} - {@errorData}",
          endpoint,
          nextResponse.status,
          nextResponse.statusText,
          errorData
        )
        throw new Error(`Failed to GET '${endpoint}' during pagination: ${nextResponse.status} ${nextResponse.statusText}`)
      }
      result = await nextResponse.json()
      if (!result || !("value" in result)) {
        logger.error("Graph API GET request to endpoint '{endpoint}' returned no data during pagination", endpoint)
        throw new Error(`Graph API GET request to endpoint '${endpoint}' returned no data during pagination`)
      }
      logger.info("Graph API GET request to endpoint '{endpoint}' fetched next page with {itemCount} items", endpoint, result.value.length)
      paginatedResult.push(...result.value)
    }
    logger.info("Graph API GET request to endpoint '{endpoint}' completed with total {itemCount} items", endpoint, paginatedResult.length)
    return paginatedResult as T
  }

  private async getEnterpriseAppAssignments(appId: string): Promise<AppRoleAssignment[]> {
    return await this.graphGet<AppRoleAssignment[]>(`servicePrincipals(appId='${appId}')/appRoleAssignedTo?$select=id,appRoleId,principalDisplayName,principalId,principalType&$top=999`)
  }

  private async getGroupMembers(groupId: string): Promise<User[]> {
    return await this.graphGet<User[]>(`groups/${groupId}/members?$select=id,userPrincipalName,displayName,companyName,department,company,onPremisesSamAccountName,accountEnabled`)
  }

  async getEnterpriseApplicationUsers(): Promise<User[]> {
    const appRoleAssignments: AppRoleAssignment[] = await this.getEnterpriseAppAssignments(FRONTEND_APP_REGISTRATION_ID)

    const groupAssignments = appRoleAssignments.filter((assignment) => assignment.principalType === "Group")

    const allUsers: Record<string, User> = {}

    for (const assignment of groupAssignments) {
      logger.info("Group assignment for app: {assignmentId} - {groupId} - {groupName}", assignment.id, assignment.principalId, assignment.principalDisplayName)
      const members = await this.getGroupMembers(assignment.principalId)
      logger.info("Group {groupId} has {memberCount} members", assignment.principalId, members.length)

      members.forEach((member) => {
        if (!allUsers[member.id]) {
          allUsers[member.id] = member
        }
      })
      logger.info("Total unique users collected so far: {userCount}", Object.keys(allUsers).length)
    }

    return Object.values(allUsers)
  }
}
