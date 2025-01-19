import { defineCommand } from "citty"
import { consola } from "consola"

import { getValidAccessToken } from "~/modules/video-uploader/lib/auth"

export const start = defineCommand({
  meta: {
    name: "start",
    description: "Start the cron job for video generation",
  },
  async run() {
    try {
      // Get initial access token and ensure we're authenticated
      await getValidAccessToken()

      // Set up cleanup on process exit
      const cleanup = () => {
        consola.info("Shutting down...")
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
