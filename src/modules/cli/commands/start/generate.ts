import { defineCommand } from "citty"
import { consola } from "consola"
import { CronJob } from "cron"
import process from "node:process"

import { generateVideo } from "../../lib/generate-video"

export const generate = defineCommand({
  meta: {
    name: "generate",
    description: "Start the automated video generation service",
  },
  args: {
    schedule: {
      alias: "s",
      type: "string",
      description: "Cron schedule expression (default: every 6 hours)",
      default: "0 0 */6 * * *",
    },
  },

  run({ args: { schedule } }) {
    try {
      const job = new CronJob(
        schedule,
        async () => {
          try {
            consola.info("Starting scheduled video generation...")
            await generateVideo()
            consola.success("Scheduled video generation completed")
          } catch (error) {
            consola.error("Scheduled video generation failed:", error)
          }
        },
        null,
        true,
        "UTC",
      )

      const cleanup = () => {
        console.log("\nReceived shutdown signal. Cleaning up...")
        job.stop()
        process.exit(0)
      }

      process.on("SIGINT", cleanup)
      process.on("SIGTERM", cleanup)

      consola.success(
        `Video generation service started with schedule: ${schedule}\n` +
          "Press Ctrl+C to stop.",
      )
    } catch (error) {
      consola.error("Failed to start video generation service:", error)
      process.exit(1)
    }
  },
})
