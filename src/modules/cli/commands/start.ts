import { defineCommand } from "citty"
import { consola } from "consola"
import { CronJob } from "cron"
import process from "node:process"

import { startBackgroundRefresh } from "~/modules/video-uploader/lib/auth"

import { generateVideo } from "../lib/generate-video"

export const start = defineCommand({
  meta: {
    name: "start",
    description: "Start the automated video generation service",
  },
  args: {
    schedule: {
      alias: "s",
      type: "string",
      description: "Cron schedule expression (default: every 6 hours)",
      default: "0 0 */6 * * *", // Note: cron package uses 6-part expression with seconds
    },
    upload: {
      alias: "u",
      type: "boolean",
      description: "Upload generated videos to YouTube",
      default: true,
    },
  },

  async run({ args: { schedule, upload } }) {
    try {
      // Start token refresh service first
      const stopRefresh = await startBackgroundRefresh()

      // Create the cron job
      const job = new CronJob(
        schedule,
        async () => {
          try {
            consola.info("Starting scheduled video generation...")
            await generateVideo(upload)
            consola.success("Scheduled video generation completed")
          } catch (error) {
            consola.error("Scheduled video generation failed:", error)
          }
        },
        null, // onComplete
        true, // start,
        "UTC", // timezone
      )

      // Handle cleanup on application exit
      const cleanup = () => {
        console.log("\nReceived shutdown signal. Cleaning up...")
        job.stop()
        stopRefresh()
        process.exit(0)
      }

      process.on("SIGINT", cleanup)
      process.on("SIGTERM", cleanup)

      consola.success(
        `Video generation service started with schedule: ${schedule}\n` +
          `Auto-upload is ${upload ? "enabled" : "disabled"}\n` +
          "Press Ctrl+C to stop.",
      )

      // Keep the process running
      // await new Promise(() => {})
    } catch (error) {
      consola.error("Failed to start video generation service:", error)
      process.exit(1)
    }
  },
})
