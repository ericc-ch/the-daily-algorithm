import { consola } from "consola"
import fs from "node:fs/promises"

import { PATHS } from "~/lib/paths"

export interface AuthResult {
  accessToken: string
  expiresAt: Date
}

interface StoredTokens {
  accessToken: string
  expiresAt: string // ISO date string
}

export async function saveTokens(tokens: AuthResult): Promise<void> {
  consola.debug("Saving authentication tokens...")
  const storedTokens: StoredTokens = {
    accessToken: tokens.accessToken,
    expiresAt: tokens.expiresAt.toISOString(),
  }
  await fs.writeFile(PATHS.TOKEN_PATH, JSON.stringify(storedTokens, null, 2))
  consola.success("Authentication tokens saved successfully")
}

export async function loadTokens(): Promise<AuthResult | null> {
  consola.debug("Loading stored authentication tokens...")
  try {
    const data = await fs.readFile(PATHS.TOKEN_PATH, "utf-8")
    const tokens = JSON.parse(data) as StoredTokens
    const result = {
      accessToken: tokens.accessToken,
      expiresAt: new Date(tokens.expiresAt),
    }
    consola.success("Authentication tokens loaded successfully")
    return result
  } catch {
    consola.info("No stored authentication tokens found")
    return null
  }
}