import { consola } from "consola"
import { Hono } from "hono"
import { serve, type ServerHandler } from "srvx"

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "medium",
})

const AUTH_PORT = 4160
const AUTH_TIMEOUT = 5 * 60 * 1000 // 5 minutes

import * as arctic from "arctic"

import { ENV } from "~/lib/env"

import {
  initializeAuth,
  createAuthUrl,
  validateAuthCode,
  refreshAccessToken,
} from "./google-oauth"
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

  app.get("/", (c) => c.redirect(authUrl))

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

    consola.info("Please open this URL in your browser to authenticate:")
    consola.info(`http://localhost:${AUTH_PORT}`)

    const tokens = await promise
    return tokens
  } catch (error) {
    clearTimeout(timeoutId)
    await server?.close()
    throw error
  }
}

const REFRESH_INTERVAL = 30 * 60 * 1000 // 30 minutes

export async function refreshTokenIfNeeded(): Promise<void> {
  try {
    let tokens: AuthResult
    try {
      tokens = await loadTokens()
    } catch (_error) {
      consola.info("No tokens found, starting new authentication")
      tokens = await authenticateWithGoogle()
      await saveTokens(tokens)
    }

    const expiresIn = tokens.expiresAt.getTime() - Date.now()
    if (expiresIn <= 30 * 60 * 1000) {
      // Refresh if less than 30 minutes until expiry
      consola.info("Refreshing access token in background")
      const google = new arctic.Google(
        ENV.GOOGLE_CLIENT_ID,
        ENV.GOOGLE_CLIENT_SECRET,
        "http://localhost:4160/auth/callback",
      )

      const newTokens = await refreshAccessToken(google, tokens.refreshToken)
      const updatedTokens = {
        ...newTokens,
        refreshToken: tokens.refreshToken,
      }
      await saveTokens(updatedTokens)
      consola.success("Background token refresh successful")
    }
  } catch (error) {
    consola.error("Background token refresh failed:", error)
  }
}

export async function startBackgroundRefresh(): Promise<() => void> {
  // Do initial refresh
  await refreshTokenIfNeeded()

  const intervalId = setInterval(refreshTokenIfNeeded, REFRESH_INTERVAL)
  consola.success("Background token refresh started")

  // Return cleanup function
  return () => {
    clearInterval(intervalId)
    consola.info("Background token refresh stopped")
  }
}

export async function getValidAccessToken(): Promise<string> {
  let tokens: AuthResult

  try {
    tokens = await loadTokens()
  } catch (_error) {
    consola.info("No tokens found, starting new authentication flow")
    tokens = await authenticateWithGoogle()
    await saveTokens(tokens)
    consola.info(
      `New access token will expire at ${dateFormatter.format(tokens.expiresAt)}`,
    )
    return tokens.accessToken
  }

  const expiresIn = tokens.expiresAt.getTime() - Date.now()
  const expiresInMinutes = Math.floor(expiresIn / (60 * 1000))
  consola.info(
    `Current access token expires in ${expiresInMinutes} minutes (at ${dateFormatter.format(tokens.expiresAt)})`,
  )

  if (expiresIn <= 5 * 60 * 1000) {
    consola.info("Access token expired, attempting to refresh")
    const google = new arctic.Google(
      ENV.GOOGLE_CLIENT_ID,
      ENV.GOOGLE_CLIENT_SECRET,
      "http://localhost:4160/auth/callback",
    )

    try {
      const newTokens = await refreshAccessToken(google, tokens.refreshToken)
      const updatedTokens = {
        ...newTokens,
        refreshToken: tokens.refreshToken, // Keep the existing refresh token
      }
      await saveTokens(updatedTokens)
      consola.info(
        `Refreshed access token will expire at ${dateFormatter.format(newTokens.expiresAt)}`,
      )
      return newTokens.accessToken
    } catch (_error) {
      consola.warn("Failed to refresh token, starting new authentication flow")
      const newTokens = await authenticateWithGoogle()
      await saveTokens(newTokens)
      return newTokens.accessToken
    }
  }

  return tokens.accessToken
}
