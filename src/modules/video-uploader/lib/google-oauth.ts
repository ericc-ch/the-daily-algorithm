import * as arctic from "arctic"

import { ENV } from "~/lib/env"

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
  return authState.google
    .createAuthorizationURL(authState.state, authState.codeVerifier, scopes)
    .toString()
}

export const validateAuthCode = async (authState: AuthState, code: string) => {
  try {
    const tokens = await authState.google.validateAuthorizationCode(
      code,
      authState.codeVerifier,
    )
    return {
      accessToken: tokens.accessToken(),
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

export const initializeAuth = createAuthState
