import { defineCommand } from "citty"
import { consola } from "consola"
import { CronJob } from "cron"
import process from "node:process"

import { generateVideo } from "../../lib/generate-video"

function setupGracefulShutdown(cleanup: () => void) {
  process.on("SIGINT", cleanup)
  process.on("SIGTERM", cleanup)
}

async function runContinuousGeneration() {
  consola.info("Starting continuous video generation...")

  const cleanup = () => {
    console.log("\nReceived shutdown signal. Cleaning up...")
    process.exit(0)
  }

  setupGracefulShutdown(cleanup)

  consola.success(
    "Continuous video generation service started\n" + "Press Ctrl+C to stop.",
  )

  while (true) {
    try {
      await generateVideo()
      consola.success("Video generation completed, starting next one...")
    } catch (error) {
      consola.error("Video generation failed:", error)
      // Wait a bit before retrying after failure
      await new Promise((resolve) => setTimeout(resolve, 5_000))
    }
  }
}

function runScheduledGeneration(schedule: string) {
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

  setupGracefulShutdown(cleanup)

  consola.success(
    `Video generation service started with schedule: ${schedule}\n` +
      "Press Ctrl+C to stop.",
  )
}

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
    continuous: {
      alias: "c",
      type: "boolean",
      description: "Run continuously instead of using a schedule",
      default: false,
    },
  },

  async run({ args: { schedule, continuous } }) {
    try {
      if (continuous) {
        await runContinuousGeneration()
      } else {
        runScheduledGeneration(schedule)
      }
    } catch (error) {
      consola.error("Failed to start video generation service:", error)
      process.exit(1)
    }
  },
})
