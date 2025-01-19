import { defineCommand } from "citty"
import { consola } from "consola"

import { getValidAccessToken } from "~/modules/video-uploader/lib/auth"
import { saveTokens } from "~/modules/video-uploader/lib/token-storage"

interface TokenJSON {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export const auth = defineCommand({
  meta: {
    name: "auth",
    description: "Authenticate with Google",
  },
  args: {
    manual: {
      alias: "m",
      type: "boolean",
      description:
        "Use manual authentication (Copy locally generated token.json).",
      default: false,
    },
  },
  async run({ args: { manual } }) {
    try {
      if (manual) {
        consola.info("Please paste your token.json content:")
        const input = await consola.prompt("Token JSON:", {
          type: "text",
          multiline: true,
          cancel: "reject",
        })

        try {
          const tokens = JSON.parse(input) as TokenJSON
          if (
            !tokens.accessToken ||
            !tokens.refreshToken ||
            !tokens.expiresAt
          ) {
            throw new Error("Invalid token format")
          }

          await saveTokens({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: new Date(tokens.expiresAt),
          })
          consola.success("Tokens saved successfully")
        } catch (error) {
          consola.error("Invalid token format:", error)
          process.exit(1)
        }
      } else {
        await getValidAccessToken()
      }
      consola.success("Successfully authenticated with Google")
    } catch (error) {
      consola.error("Authentication failed:", error)
      process.exit(1)
    }
  },
})
