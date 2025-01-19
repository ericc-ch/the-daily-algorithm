import * as arctic from "arctic"

import { ENV } from "~/lib/env"

interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

interface AuthState {
  google: arctic.Google
  codeVerifier: string
  state: string
}

const createAuthState = (): AuthState => ({
  google: new arctic.Google(
    ENV.GOOGLE_CLIENT_ID,
    ENV.GOOGLE_CLIENT_SECRET,
    "http://localhost:4160/auth/callback",
  ),
  codeVerifier: arctic.generateCodeVerifier(),
  state: arctic.generateState(),
})

export const createAuthUrl = (authState: AuthState): string => {
  const scopes = ["https://www.googleapis.com/auth/youtube.upload"]
  const url = authState.google.createAuthorizationURL(
    authState.state,
    authState.codeVerifier,
    scopes,
  )

  url.searchParams.set("access_type", "offline")
  url.searchParams.set("prompt", "consent")

  return url.toString()
}

export const validateAuthCode = async (
  authState: AuthState,
  code: string,
): Promise<AuthTokens> => {
  try {
    const tokens = await authState.google.validateAuthorizationCode(
      code,
      authState.codeVerifier,
    )
    return {
      accessToken: tokens.accessToken(),
      refreshToken: tokens.refreshToken(),
      expiresAt: tokens.accessTokenExpiresAt(),
    }
  } catch (error) {
    if (error instanceof arctic.OAuth2RequestError) {
      throw new Error(`OAuth2 request failed: ${error.message}`)
    }
    if (error instanceof arctic.ArcticFetchError) {
      throw new Error(`Network request failed: ${error.message}`)
    }
    throw error
  }
}

export const refreshAccessToken = async (
  google: arctic.Google,
  refreshToken: string,
): Promise<Omit<AuthTokens, "refreshToken">> => {
  try {
    const tokens = await google.refreshAccessToken(refreshToken)
    return {
      accessToken: tokens.accessToken(),
      expiresAt: tokens.accessTokenExpiresAt(),
    }
  } catch (error) {
    if (error instanceof arctic.OAuth2RequestError) {
      throw new Error(`OAuth2 refresh failed: ${error.message}`)
    }
    if (error instanceof arctic.ArcticFetchError) {
      throw new Error(`Network request failed: ${error.message}`)
    }
    throw error
  }
}

export const initializeAuth = createAuthState
