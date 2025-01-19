import { defineCommand } from "citty"
import { consola } from "consola"
import process from "node:process"

import { startBackgroundRefresh } from "~/modules/video-uploader/lib/auth"

export const start = defineCommand({
  meta: {
    name: "start",
    description: "Start the token refresh service",
  },

  async run() {
    try {
      const stopRefresh = await startBackgroundRefresh()

      // Handle cleanup on application exit
      process.on("SIGINT", () => {
        console.log("\nReceived SIGINT. Cleaning up...")
        stopRefresh()
        process.exit(0)
      })

      process.on("SIGTERM", () => {
        console.log("\nReceived SIGTERM. Cleaning up...")
        stopRefresh()
        process.exit(0)
      })

      consola.success("Token refresh service started. Press Ctrl+C to stop.")

      // Keep the process running
      await new Promise(() => {})
    } catch (error) {
      consola.error("Failed to start token refresh service:", error)
      process.exit(1)
    }
  },
})
