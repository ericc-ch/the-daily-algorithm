import { defineCommand } from "citty"
import { consola } from "consola"

import { getValidAccessToken } from "~/modules/video-uploader/lib/auth"
import { createRefreshManager } from "~/modules/video-uploader/lib/refresh-manager"
import { loadTokens } from "~/modules/video-uploader/lib/token-storage"

export const start = defineCommand({
  meta: {
    name: "start",
    description: "Start the application and maintain authentication",
  },
  async run() {
    try {
      // Get initial access token and ensure we're authenticated
      await getValidAccessToken()

      // Get the tokens to initialize the refresh manager
      const tokens = await loadTokens()
      if (!tokens) {
        throw new Error("No tokens found after authentication")
      }

      // Create and start the refresh manager
      const refreshManager = createRefreshManager(tokens)
      refreshManager.start()

      // Set up cleanup on process exit
      const cleanup = () => {
        consola.info("Shutting down...")
        refreshManager.stop()
        process.exit(0)
      }

      process.on("SIGINT", cleanup)
      process.on("SIGTERM", cleanup)

      // Keep the process running
      consola.success("Application started successfully")
      await new Promise(() => {}) // Never resolves, keeping the process alive
    } catch (error) {
      consola.error("Failed to start application:", error)
      process.exit(1)
    }
  },
})
