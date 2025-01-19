import { consola } from "consola"
import { Hono } from "hono"
import open from "open"
import { serve, type ServerHandler } from "srvx"

const AUTH_PORT = 4160
const AUTH_TIMEOUT = 5 * 60 * 1000 // 5 minutes

import { initializeAuth, createAuthUrl, validateAuthCode } from "./google-oauth"
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
    consola.info(
      `New access token will expire at ${newTokens.expiresAt.toLocaleString()}`,
    )
    return newTokens.accessToken
  }

  const expiresIn = tokens.expiresAt.getTime() - Date.now()
  const expiresInMinutes = Math.floor(expiresIn / (60 * 1000))
  consola.info(
    `Current access token expires in ${expiresInMinutes} minutes (at ${tokens.expiresAt.toLocaleString()})`,
  )

  if (expiresIn <= 5 * 60 * 1000) {
    consola.info("Access token is expired, starting new authentication")
    const newTokens = await authenticateWithGoogle()
    await saveTokens(newTokens)
    consola.info(
      `New access token will expire at ${newTokens.expiresAt.toLocaleString()}`,
    )
    return newTokens.accessToken
  }

  return tokens.accessToken
}
