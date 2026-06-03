import { existsSync } from "node:fs"
import { FINT_VERSION, MOCK_FINT, MOCK_FINT_DATA_PATH } from "../../config.js"
import type { IFintClient } from "../../types/fint/fint-client.js"
import { FintClient } from "./fint-client.js"
import { FintClientV3 } from "./fint-client-v3.js"
import { generateFintMockData } from "./generate-fint-mock-data.js"
import { MockFintClient } from "./mock-fint-client.js"

export const getFintClient = (): IFintClient => {
  if (!MOCK_FINT) {
    if (FINT_VERSION === "V3") {
      return new FintClientV3()
    }

    return new FintClient()
  }

  if (!MOCK_FINT_DATA_PATH) {
    throw new Error("MOCK_FINT is set to true, but MOCK_FINT_DATA_PATH is not set to a valid .json file path")
  }

  if (!existsSync(MOCK_FINT_DATA_PATH)) {
    generateFintMockData()
  }

  return new MockFintClient()
}
