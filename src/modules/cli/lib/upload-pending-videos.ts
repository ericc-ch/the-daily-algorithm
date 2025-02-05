import { consola } from "consola"
import { eq } from "drizzle-orm"
import { existsSync } from "node:fs"

import type { Video } from "~/database/schemas/video"

import { getDB } from "~/database/main"
import { video } from "~/database/schemas/video"
import { uploadVideo } from "~/modules/video-uploader/main"

async function updateVideoStatus(
  videoId: number,
  status: Video["status"],
  error?: unknown,
) {
  await getDB()
    .update(video)
    .set({
      status,
      updated_at: new Date(),
    })
    .where(eq(video.id, videoId))

  if (error) {
    consola.error(`Video ID ${videoId} failed:`, error)
  }
}

async function processVideo(entry: Video) {
  const { id, video_path, title, description } = entry

  if (!video_path || !title || !description) {
    throw new Error("Missing required metadata for upload")
  }

  if (!existsSync(video_path)) {
    throw new Error(`Video file not found at path: ${video_path}`)
  }

  consola.info(`Processing upload for video ID ${id}...`)

  try {
    await uploadVideo({
      videoPath: video_path,
      title,
      description,
      privacyStatus: "public",
    })

    await updateVideoStatus(id, "completed")
    consola.success(`Successfully uploaded video ID ${id}`)
  } catch (error) {
    await updateVideoStatus(id, "failed", error)
    // Re-throw to be handled by the main function
    throw error
  }
}

async function getPendingVideo() {
  const result = await getDB()
    .select()
    .from(video)
    .where(eq(video.status, "pending_upload"))
    .orderBy(video.created_at)
    .limit(1)

  return result.at(0)
}

export async function uploadPendingVideos() {
  try {
    const pendingVideo = await getPendingVideo()

    if (!pendingVideo) {
      consola.info("No pending videos found to upload")
      return
    }

    await processVideo(pendingVideo)
  } catch (error) {
    consola.error("Upload process failed:", error)
    // Don't exit process - let the service continue running
  }
}
