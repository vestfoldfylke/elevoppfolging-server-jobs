import { logger } from "@vestfoldfylke/loglady"
import { getFintConfig, MOCK_FINT } from "../../config.js"
import type { FintAccessTokenResponse, FintConfig } from "../../types/fint/fint-client.js"
import { MemoryCache, type MemoryCacheEntry } from "../memory-cache.js"

const authOptions: FintConfig | null = !MOCK_FINT ? getFintConfig() : null

const tokenCache: MemoryCache<FintAccessTokenResponse> = new MemoryCache<FintAccessTokenResponse>()
const tokenCacheKey: string = !MOCK_FINT ? `fint_token_${authOptions?.VERSION}` : "fint_token"

const isTokenValid = (input: MemoryCacheEntry<FintAccessTokenResponse>): boolean => {
  const expiresAt: number = input.insertedAt + input.expires_in * 1000
  const msNow: number = Date.now()

  return expiresAt > msNow
}

export const getFintAccessToken = async (): Promise<string> => {
  if (!authOptions) {
    throw new Error("Missing auth options")
  }

  logger.info("Fetching {FintVersion} access token from FINT", authOptions.VERSION)

  const cachedToken: MemoryCacheEntry<FintAccessTokenResponse> | undefined = tokenCache.get(tokenCacheKey, isTokenValid)
  if (cachedToken) {
    logger.info(
      "Using cached {FintVersion} access token from FINT. Expires in {ExpiresInSeconds} seconds",
      authOptions.VERSION,
      Math.floor((cachedToken.insertedAt + cachedToken.expires_in * 1000 - Date.now()) / 1000)
    )
    return cachedToken.access_token
  }

  const options: Record<string, string> = {
    grant_type: "password",
    username: authOptions.USERNAME,
    password: authOptions.PASSWORD,
    client_id: authOptions.CLIENT_ID,
    client_secret: authOptions.CLIENT_SECRET,
    scope: authOptions.SCOPE
  }

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
      "Failed to fetch {FintVersion} access token from FINT token endpoint url {TokenEndpointUrl}. Status: {Status}. StatusText: {StatusText}. Error: {@Error}",
      authOptions.VERSION,
      authOptions.TOKEN_URL,
      response.status,
      response.statusText,
      error
    )
    throw new Error(`Failed to fetch ${authOptions.VERSION} access token from FINT. Status: ${response.status}. StatusText: ${response.statusText}. Error: ${JSON.stringify(error)}`)
  }

  const tokenResponse: FintAccessTokenResponse = await response.json()
  logger.info("Fetched {FintVersion} access token from FINT. Expires in {ExpiresInSeconds}", authOptions.VERSION, tokenResponse.expires_in)
  tokenCache.set(tokenCacheKey, tokenResponse)

  return tokenResponse.access_token
}
