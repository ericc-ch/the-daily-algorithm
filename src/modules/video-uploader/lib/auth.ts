import { consola } from "consola"
import { Hono } from "hono"
import open from "open"
import { serve, type ServerHandler } from "srvx"

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

      await server.close()

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
      await server.close()
      reject(error)
      return c.text("Authentication failed. You can close this window.", 400)
    }
  })

  consola.info("Starting local authentication server...")
  const server = serve({
    fetch: app.fetch as ServerHandler,
    port: 4160,
  })

  await open(authUrl)
  consola.info("Opening browser for authentication...")

  const tokens = await promise
  const refreshManager = createRefreshManager(tokens)
  refreshManager.start()
  return tokens
}

export async function getValidAccessToken(): Promise<string> {
  const tokens = await loadTokens()
  if (!tokens) {
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
