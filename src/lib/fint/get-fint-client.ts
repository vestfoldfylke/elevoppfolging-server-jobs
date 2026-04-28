import { MOCK_FINT } from "../../config.js"
import type { IFintClient } from "../../types/fint/fint-client.js"
import { FintClient } from "./fint-client.js"
import { MockFintClient } from "./mock-fint-client.js"

const fintClient: IFintClient = MOCK_FINT ? new MockFintClient() : new FintClient()

export const getFintClient = (): IFintClient => fintClient

/* I test med mock data

Hvis vi skal ha persistent mock-data, så kan vi enten fyre det opp en gang lokalt - og bare drite i sync i test-azf

- Sjekke etter fnr- og feidenavn
- Vi har sikkert lagret notater med fnr og en mongodbid eller system id eller no.
- 

*/
