import { consola } from "consola"
import { Hono } from "hono"
import { serve, type ServerHandler } from "srvx"

import { initializeAuth, createAuthUrl, validateAuthCode } from "./auth"

interface AuthResult {
  accessToken: string
  refreshToken: string | null
  expiresAt: Date
}

export async function authenticateWithGoogle(): Promise<AuthResult> {
  const { promise, resolve, reject } = Promise.withResolvers<AuthResult>()

  const app = new Hono()
  const authState = initializeAuth()

  app.get("/", (c) => {
    const authUrl = createAuthUrl(authState)
    return c.redirect(authUrl)
  })

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

  consola.info(
    "Please open http://localhost:4160 in your browser to authenticate",
  )

  return promise
}

export async function uploadVideo() {
  try {
    const auth = await authenticateWithGoogle()
    consola.success("Successfully authenticated with Google")
    // TODO: Implement video upload logic using the auth tokens
  } catch (error) {
    consola.error("Authentication failed:", error)
    throw error
  }
}
