import { defineCommand } from "citty"
import { consola } from "consola"
import { not, inArray } from "drizzle-orm"
import { existsSync } from "node:fs"
import { unlink } from "node:fs/promises"

import { getDB } from "~/database/main"
import { video } from "~/database/schemas/video"

export const prune = defineCommand({
  meta: {
    name: "prune",
    description:
      "Delete video records and their rendered videos based on their status",
  },
  args: {
    all: {
      alias: "a",
      type: "boolean",
      description: "Delete all video records regardless of status",
      default: false,
    },
  },
  async run({ args: { all: deleteAll } }) {
    try {
      const db = getDB()

      if (deleteAll) {
        // First fetch all records to get video paths
        const videos = await db.select().from(video).execute()

        // Delete video files if they exist
        for (const vid of videos) {
          if (vid.video_path && existsSync(vid.video_path)) {
            await unlink(vid.video_path)
            consola.info(`Deleted video file: ${vid.video_path}`)
          }
        }

        // Delete all records
        await db.delete(video).execute()
        consola.success(`Deleted all video records and their rendered videos`)
        return
      }

      // Delete records that are not pending_upload or completed
      await db
        .delete(video)
        .where(not(inArray(video.status, ["pending_upload", "completed"])))
        .execute()

      consola.success(
        `Deleted video records with status other than 'pending_upload' and 'completed'`,
      )
    } catch (error) {
      consola.error("Failed to prune database records:", error)
      process.exit(1)
    }
  },
})
