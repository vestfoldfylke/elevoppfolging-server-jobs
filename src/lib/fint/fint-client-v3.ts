import { readFileSync } from "node:fs"
import { logger } from "@vestfoldfylke/loglady"
import { getFintConfig, MOCK_FINT } from "../../config.js"
import type { FintAccessTokenResponse, FintConfig, FintGraphQlResponse, IFintClient } from "../../types/fint/fint-client.js"
import type { FintSkoleInfo, FintSkolerRest } from "../../types/fint/fint-school.js"
import type { FintElevforhold, FintKlassemedlemskap, FintSchoolWithStudents } from "../../types/fint/fint-school-with-students.js"
import type { FintBasisgruppemedlemskap, FintElevforholdV3, FintSchoolWithStudentsV3 } from "../../types/fint/fint-school-with-students-v3.js"

const authOptions: FintConfig | null = !MOCK_FINT ? getFintConfig() : null

type FintQueryVariables = Record<string, string | number>

type FintPayload = {
  query: string
  variables?: FintQueryVariables
}

export class FintClientV3 implements IFintClient {
  private readonly schoolWithStudentsQuery: string

  constructor() {
    this.schoolWithStudentsQuery = readFileSync("./src/lib/fint/queries/school-with-students-v3.graphql", "utf8")
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
    return this.convertFromV3ToV4(await this.callFintGraphql<FintSchoolWithStudentsV3>(this.schoolWithStudentsQuery, { schoolNumber }))
  }

  private async getAccessToken(): Promise<string> {
    if (!authOptions) {
      throw new Error("Missing auth options")
    }

    const options: Record<string, string> = {
      grant_type: "password",
      username: authOptions.USERNAME,
      password: authOptions.PASSWORD,
      client_id: authOptions.CLIENT_ID,
      client_secret: authOptions.CLIENT_SECRET,
      scope: authOptions.SCOPE
    }

    logger.info("Fetching access token from FINT")
    const response: Response = await fetch(authOptions.TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(options).toString()
    })

    if (!response.ok) {
      const error = await response.json()
      logger.error(
        "Failed to fetch access token from FINT token endpoint url {TokenEndpointUrl}. Status: {Status}. StatusText: {StatusText}. Error: {@Error}",
        authOptions.TOKEN_URL,
        response.status,
        response.statusText,
        error
      )
      throw new Error(`Failed to fetch access token from FINT. Status: ${response.status}. StatusText: ${response.statusText}. Error: ${JSON.stringify(error)}`)
    }

    const tokenResponse: FintAccessTokenResponse = await response.json()
    logger.info("Fetched access token from FINT. Expires in {ExpiresInSeconds}", tokenResponse.expires_in)

    return tokenResponse.access_token
  }

  private async callFintGraphql<T>(query: string, variables?: FintQueryVariables): Promise<T> {
    if (!authOptions) {
      throw new Error("Missing auth options")
    }

    const accessToken: string = await this.getAccessToken()

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

    const accessToken: string = await this.getAccessToken()

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

  private convertFromV3ToV4(schoolWithStudents: FintSchoolWithStudentsV3): FintSchoolWithStudents {
    logger.info(
      "Converting school with students data from FINT V3 format to V4 format for school {SchoolName} ({SchoolNumber}) with {ElevforholdCount} elevforhold",
      schoolWithStudents.skole?.navn,
      schoolWithStudents.skole?.skolenummer.identifikatorverdi,
      schoolWithStudents.skole?.elevforhold?.length ?? null
    )
    return {
      skole: !schoolWithStudents.skole
        ? null
        : {
            navn: schoolWithStudents.skole.navn,
            skolenummer: schoolWithStudents.skole.skolenummer,
            elevforhold: !schoolWithStudents.skole.elevforhold
              ? null
              : schoolWithStudents.skole.elevforhold.map((elevforhold: FintElevforholdV3 | null): FintElevforhold | null => {
                  if (!elevforhold) {
                    return null
                  }

                  return {
                    hovedskole: elevforhold.hovedskole,
                    systemId: elevforhold.systemId,
                    gyldighetsperiode: elevforhold.gyldighetsperiode,
                    elev: elevforhold.elev,
                    klassemedlemskap: !elevforhold.basisgruppemedlemskap
                      ? null
                      : elevforhold.basisgruppemedlemskap.map((basisgruppemedlemskap: FintBasisgruppemedlemskap | null): FintKlassemedlemskap | null => {
                          if (!basisgruppemedlemskap) {
                            return null
                          }

                          return {
                            systemId: basisgruppemedlemskap.systemId,
                            gyldighetsperiode: basisgruppemedlemskap.gyldighetsperiode,
                            klasse: {
                              navn: basisgruppemedlemskap.basisgruppe.navn,
                              systemId: basisgruppemedlemskap.basisgruppe.systemId,
                              trinn: basisgruppemedlemskap.basisgruppe.trinn,
                              undervisningsforhold: basisgruppemedlemskap.basisgruppe.undervisningsforhold
                            }
                          }
                        }),
                    undervisningsgruppemedlemskap: elevforhold.undervisningsgruppemedlemskap,
                    kontaktlarergruppemedlemskap: elevforhold.kontaktlarergruppemedlemskap
                  }
                })
          }
    }
  }
}
