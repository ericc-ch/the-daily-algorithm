import { consola } from "consola"
import { eq } from "drizzle-orm"

import { db } from "~/database/main"
import { video } from "~/database/schemas/video"
import { PATHS } from "~/lib/paths"
import { uploadVideo } from "~/modules/video-uploader/main"

export async function uploadPendingVideos() {
  // Get videos pending upload
  const pending = await db
    .select()
    .from(video)
    .where(eq(video.status, "pending_upload"))
    .orderBy(video.created_at)
    .limit(1) // respect rate limits by processing one at a time

  for (const entry of pending) {
    try {
      consola.info(`Processing upload for video ID ${entry.id}...`)

      const videoPath = PATHS.outputPath(entry.script!)

      await uploadVideo({
        videoPath,
        title: entry.title!,
        description: entry.description!,
        privacyStatus: "public",
      })

      await db
        .update(video)
        .set({
          status: "completed",
          updated_at: new Date(),
        })
        .where(eq(video.id, entry.id))

      consola.success(`Successfully uploaded video ID ${entry.id}`)
    } catch (error) {
      consola.error(`Failed to upload video ID ${entry.id}:`, error)
    }
  }
}
