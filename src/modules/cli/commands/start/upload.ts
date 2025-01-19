import { defineCommand } from "citty"
import { consola } from "consola"
import { CronJob } from "cron"
import process from "node:process"

import { startBackgroundRefresh } from "~/modules/video-uploader/lib/auth"

import { uploadPendingVideos } from "../../lib/upload-pending-videos"

export const upload = defineCommand({
  meta: {
    name: "upload",
    description: "Start the video upload service",
  },
  args: {
    schedule: {
      alias: "s",
      type: "string",
      description:
        "Cron schedule expression (default: every 4 hours to stay within YouTube API limits)",
      default: "0 */4 * * *",
    },
  },

  async run({ args: { schedule } }) {
    try {
      const stopRefresh = await startBackgroundRefresh()

      const job = new CronJob(schedule, async () => {
        try {
          await uploadPendingVideos()
        } catch (error) {
          consola.error("Upload process failed:", error)
        }
      })

      const cleanup = () => {
        console.log("\nReceived shutdown signal. Cleaning up...")
        job.stop()
        stopRefresh()
        process.exit(0)
      }

      process.on("SIGINT", cleanup)
      process.on("SIGTERM", cleanup)

      consola.success(
        `Video upload service started with schedule: ${schedule}\n` +
          "Press Ctrl+C to stop.",
      )
    } catch (error) {
      consola.error("Failed to start upload service:", error)
      process.exit(1)
    }
  },
})
