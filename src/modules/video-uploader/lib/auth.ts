import { consola } from "consola"
import { Hono } from "hono"
import fs from "node:fs/promises"
import open from "open"
import { serve, type ServerHandler } from "srvx"

import { PATHS } from "~/lib/paths"

import {
  initializeAuth,
  createAuthUrl,
  validateAuthCode,
  refreshAccessToken,
} from "./google-oauth"

interface AuthResult {
  accessToken: string
  refreshToken: string | null
  expiresAt: Date
}

interface StoredTokens {
  accessToken: string
  refreshToken: string | null
  expiresAt: string // ISO date string
}

async function saveTokens(tokens: AuthResult): Promise<void> {
  const storedTokens: StoredTokens = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt.toISOString(),
  }
  await fs.writeFile(PATHS.TOKEN_PATH, JSON.stringify(storedTokens, null, 2))
}

async function loadTokens(): Promise<AuthResult | null> {
  try {
    const data = await fs.readFile(PATHS.TOKEN_PATH, "utf-8")
    const tokens = JSON.parse(data) as StoredTokens
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(tokens.expiresAt),
    }
  } catch {
    return null
  }
}

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

      // Close server after successful auth
      await server.close()

      resolve({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      })

      // Send success page
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

  // Start local server
  consola.info("Starting local authentication server...")
  const server = serve({
    fetch: app.fetch as ServerHandler,
    port: 4160,
  })

  await open(authUrl)
  consola.info("Opening browser for authentication...")

  return promise
}

export async function getValidAccessToken(): Promise<string> {
  const tokens = await loadTokens()
  if (!tokens) {
    const newTokens = await authenticateWithGoogle()
    await saveTokens(newTokens)
    return newTokens.accessToken
  }

  // Check if token needs refresh (e.g., 5 minutes before expiry)
  const expiresIn = tokens.expiresAt.getTime() - Date.now()
  if (expiresIn <= 5 * 60 * 1000) {
    if (!tokens.refreshToken) {
      const newTokens = await authenticateWithGoogle()
      await saveTokens(newTokens)
      return newTokens.accessToken
    }

    const authState = initializeAuth()
    const refreshed = await refreshAccessToken(authState, tokens.refreshToken)
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
