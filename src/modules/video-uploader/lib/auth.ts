import { consola } from "consola"
import { Hono } from "hono"
import open from "open"
import { serve, type ServerHandler } from "srvx"

const AUTH_PORT = 4160
const AUTH_TIMEOUT = 5 * 60 * 1000 // 5 minutes

import {
  initializeAuth,
  createAuthUrl,
  validateAuthCode,
  refreshAccessToken,
} from "./google-oauth"
import { createRefreshManager } from "./refresh-manager"
import { loadTokens, saveTokens, type AuthResult } from "./token-storage"

async function authenticateWithGoogle(): Promise<AuthResult> {
  const { promise, resolve, reject } = Promise.withResolvers<AuthResult>()
  let server: Awaited<ReturnType<typeof serve>> | undefined

  // Set authentication timeout
  const timeoutId = setTimeout(() => {
    reject(new Error("Authentication timed out"))
    server?.close()?.catch(console.error)
  }, AUTH_TIMEOUT)

  const app = new Hono()
  const authState = initializeAuth()
  const authUrl = createAuthUrl(authState)

  app.get("/auth/callback", async (c) => {
    try {
      const code = c.req.query("code")
      if (!code) {
        throw new Error("No authorization code received")
      }

      const tokens = await validateAuthCode(authState, code)
      clearTimeout(timeoutId)

      await server?.close()

      resolve({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      })

      c.header("Content-Type", "text/html")
      return c.body(
        "<h1>Authentication successful!</h1><p>You can close this window now.</p>",
      )
    } catch (error) {
      clearTimeout(timeoutId)
      await server?.close()
      reject(error)
      return c.text("Authentication failed. You can close this window.", 400)
    }
  })

  try {
    consola.info("Starting local authentication server...")
    server = serve({
      fetch: app.fetch as ServerHandler,
      port: AUTH_PORT,
    })

    await open(authUrl)
    consola.info("Opening browser for authentication...")

    const tokens = await promise
    const refreshManager = createRefreshManager(tokens)
    refreshManager.start()
    return tokens
  } catch (error) {
    clearTimeout(timeoutId)
    await server?.close()
    throw error
  }
}

export async function getValidAccessToken(): Promise<string> {
  const tokens = await loadTokens()
  if (!tokens) {
    consola.info("No tokens found, starting new authentication flow")
    const newTokens = await authenticateWithGoogle()
    await saveTokens(newTokens)
    return newTokens.accessToken
  }

  const expiresIn = tokens.expiresAt.getTime() - Date.now()
  if (expiresIn <= 5 * 60 * 1000) {
    consola.info("Access token is about to expire, refreshing...")
    if (!tokens.refreshToken) {
      consola.warn("No refresh token available, initiating new authentication")
      const newTokens = await authenticateWithGoogle()
      await saveTokens(newTokens)
      return newTokens.accessToken
    }

    const authState = initializeAuth()
    consola.debug("Refreshing access token...")
    const refreshed = await refreshAccessToken(authState, tokens.refreshToken)
    consola.success("Access token refreshed successfully")
    const newTokens: AuthResult = {
      ...tokens,
      accessToken: refreshed.accessToken,
      expiresAt: refreshed.expiresAt,
    }
    await saveTokens(newTokens)
    return newTokens.accessToken
  }

  return tokens.accessToken
}
