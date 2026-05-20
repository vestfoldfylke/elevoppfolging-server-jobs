import { readFileSync } from "node:fs"
import { logger } from "@vestfoldfylke/loglady"
import { getFintConfig, MOCK_FINT } from "../../config.js"
import type { FintConfig, FintGraphQlResponse, FintPayload, FintQueryVariables, IFintClient } from "../../types/fint/fint-client.js"
import type { FintSkoleInfo, FintSkolerRest } from "../../types/fint/fint-school.js"
import type { FintSchoolWithStudents } from "../../types/fint/fint-school-with-students.js"
import { getFintAccessToken } from "./fint-access-token.js"

const authOptions: FintConfig | null = !MOCK_FINT ? getFintConfig() : null

export class FintClient implements IFintClient {
  private readonly schoolWithStudentsQuery: string

  constructor() {
    this.schoolWithStudentsQuery = readFileSync("./src/lib/fint/queries/school-with-students.graphql", "utf8")
    logger.info("Initialized FINT client for FINT version {FintVersion}", process.env.FINT_VERSION)
  }

  async getSchools(): Promise<FintSkoleInfo[]> {
    const schools: FintSkolerRest = await this.callFintRest<FintSkolerRest>("utdanning/utdanningsprogram/skole")
    if (!schools._embedded) {
      throw new Error("_embedded not found in FINT response for schools")
    }

    if (!Array.isArray(schools._embedded._entries)) {
      throw new Error("_embedded._entries must be an array")
    }

    return schools._embedded._entries.map((school: FintSkoleInfo) => {
      return {
        navn: school.navn,
        skolenummer: school.skolenummer
      }
    })
  }

  async getSchoolWithStudents(schoolNumber: string): Promise<FintSchoolWithStudents> {
    return await this.callFintGraphql<FintSchoolWithStudents>(this.schoolWithStudentsQuery, { schoolNumber })
  }

  private async callFintGraphql<T>(query: string, variables?: FintQueryVariables): Promise<T> {
    if (!authOptions) {
      throw new Error("Missing auth options")
    }

    const accessToken: string = await getFintAccessToken()

    logger.info("Calling FINT {FintVersion} graphql endpoint with variables: {HasVariables}", authOptions.VERSION, variables !== undefined)

    const payload: FintPayload = {
      query
    }

    if (variables) {
      payload.variables = variables
    }

    const response: Response = await fetch(`${authOptions.API_URL}/graphql/graphql`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ContentType: "application/json"
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json()
      logger.error("Failed to call FINT {FintVersion} graphql endpoint. Status: {Status}. StatusText: {StatusText}. Error: {@Error}", authOptions.VERSION, response.status, response.statusText, error)
      throw new Error(`Failed to call FINT ${authOptions.VERSION} graphql endpoint. Status: ${response.status}. StatusText: ${response.statusText}`)
    }

    const graphqlResponse: FintGraphQlResponse<T> = await response.json()

    if (graphqlResponse.errors) {
      logger.error("{ErrorCount} errors occured when calling FINT {FintVersion} graphql endpoint", graphqlResponse.errors.length, authOptions.VERSION)
      throw new Error(`${graphqlResponse.errors.length} errors occured when calling FINT ${authOptions.VERSION} graphql endpoint`)
    }

    if (!graphqlResponse.data) {
      logger.error("'data' property missing in graphql response when calling FINT {FintVersion} graphql endpoint", authOptions.VERSION)
      throw new Error(`'data' property missing in graphql response when calling FINT ${authOptions.VERSION} graphql endpoint`)
    }

    logger.info("Successfully called FINT {FintVersion} graphql endpoint", authOptions.VERSION)

    return graphqlResponse.data
  }

  private async callFintRest<T>(endpoint: string): Promise<T> {
    if (!authOptions) {
      throw new Error("Missing auth options")
    }

    const accessToken: string = await getFintAccessToken()

    logger.info("Calling FINT {FintVersion} REST endpoint {Endpoint}", authOptions.VERSION, endpoint)

    const response: Response = await fetch(`${authOptions.API_URL}/${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      logger.error("Failed to call FINT {FintVersion} REST endpoint. Status: {Status}. StatusText: {StatusText}. Error: {@Error}", authOptions.VERSION, response.status, response.statusText, error)
      throw new Error(`Failed to call FINT ${authOptions.VERSION} REST endpoint. Status: ${response.status}. StatusText: ${response.statusText}`)
    }

    const restResponse: T = await response.json()
    logger.info("Successfully called FINT {FintVersion} REST endpoint", authOptions.VERSION)

    return restResponse
  }
}
