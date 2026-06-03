import { existsSync } from "node:fs"
import { FINT_VERSION, MOCK_FINT, MOCK_FINT_DATA_PATH } from "../../config.js"
import type { IFintClient } from "../../types/fint/fint-client.js"
import { FintClient } from "./fint-client.js"
import { FintClientV3 } from "./fint-client-v3.js"
import { generateFintMockData } from "./generate-fint-mock-data.js"
import { MockFintClient } from "./mock-fint-client.js"

let fintClient: IFintClient | null = null

export const getFintClient = (): IFintClient => {
  if (fintClient) {
    return fintClient
  }

  if (!MOCK_FINT) {
    if (FINT_VERSION === "V3") {
      fintClient = new FintClientV3()
      return fintClient
    }

    fintClient = new FintClient()
    return fintClient
  }

  if (!MOCK_FINT_DATA_PATH) {
    throw new Error("MOCK_FINT is set to true, but MOCK_FINT_DATA_PATH is missing. must be set to a .json file path")
  }

  if (!existsSync(MOCK_FINT_DATA_PATH)) {
    try {
      generateFintMockData()
    } catch (error) {
      throw new Error(`Failed to generate mock FINT data at '${MOCK_FINT_DATA_PATH}': ${(error as Error).message}`)
    }
  }

  fintClient = new MockFintClient()
  return fintClient
}
