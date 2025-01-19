import { defineCommand } from "citty"
import { consola } from "consola"

import { getValidAccessToken } from "~/modules/video-uploader/lib/auth"

export const auth = defineCommand({
  meta: {
    name: "auth",
    description: "Authenticate with Google",
  },
  async run() {
    try {
      await getValidAccessToken()
      consola.success("Successfully authenticated with Google")
    } catch (error) {
      consola.error("Authentication failed:", error)
      process.exit(1)
    }
  },
})
