import { consola } from "consola"
import { eq, and, gte } from "drizzle-orm"
import { Buffer } from "node:buffer"
import { copyFile, writeFile } from "node:fs/promises"

import { getDB } from "~/database/main"
import { video, type Video } from "~/database/schemas/video"
import { downloadVideo } from "~/lib/download-video"
import { MIME_TYPES } from "~/lib/mime-types"
import { PATHS } from "~/lib/paths"
import { generateAudio } from "~/modules/audio-generator/main"
import { fileManager } from "~/modules/script-generator/lib/file-manager"
import { generateScript } from "~/modules/script-generator/main"
import { findRandomShort } from "~/modules/video-finder/main"
import { renderVideo } from "~/modules/video-renderer/main"

async function checkDuplicateUrl(url: string): Promise<boolean> {
  const fourMonthsAgo = new Date()
  fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4)

  const existingVideos = await getDB()
    .select()
    .from(video)
    .where(and(eq(video.source_url, url), gte(video.created_at, fourMonthsAgo)))

  return existingVideos.length > 0
}

async function updateVideoStatus(id: number, status: Video["status"]) {
  await getDB()
    .update(video)
    .set({ status, updated_at: new Date() })
    .where(eq(video.id, id))
}

export async function generateVideo(): Promise<Video> {
  // Create initial database entry
  const [entry] = await getDB()
    .insert(video)
    .values({
      status: "pending_video",
    })
    .returning()

  try {
    consola.info("Finding random YouTube Short...")
    let shortUrl = await findRandomShort()
    let isDuplicate = await checkDuplicateUrl(shortUrl)

    while (isDuplicate) {
      shortUrl = await findRandomShort()
      isDuplicate = await checkDuplicateUrl(shortUrl)

      if (isDuplicate) {
        consola.info(`Found duplicate Short: ${shortUrl}, trying again...`)
      }
    }

    consola.success(`Found unique Short: ${shortUrl}`)

    consola.info("Starting video download...")
    const location = await downloadVideo({
      url: shortUrl,
    })

    // Update status after video download
    await updateVideoStatus(entry.id, "pending_script")

    consola.info("Uploading video for processing...")
    const upload = await fileManager.uploadFile(location, {
      mimeType: MIME_TYPES.VIDEO.MP4,
    })
    consola.info("Waiting for file processing...")
    const file = await fileManager.waitForFileProcessing(upload.file)
    consola.success("File processing completed")

    consola.info("Generating script from video...")
    const script = await generateScript(file)
    consola.success("Script generation completed")

    // Update status after script generation
    await updateVideoStatus(entry.id, "pending_audio")

    consola.info("Generating audio from script...")
    const { audio, subtitle } = await generateAudio(script)
    consola.success("Audio generation completed")
    const audioBuffer = Buffer.from(await audio.arrayBuffer())

    // Update status before rendering
    await updateVideoStatus(entry.id, "pending_render")

    consola.info("Saving assets to disk...")
    await copyFile(location, PATHS.VIDEO_PATH)
    await writeFile(PATHS.AUDIO_PATH, audioBuffer)
    await writeFile(PATHS.SUBTITLE_PATH, JSON.stringify(subtitle))
    consola.success("Assets saved successfully")

    consola.info("Rendering final video...")
    const result = await renderVideo()
    consola.success("Video rendering completed")

    const videoPath = PATHS.outputPath(script)

    consola.info("Saving final video...")
    await writeFile(videoPath, Buffer.from(result.buffer))
    consola.success("Final video saved successfully")

    // Update database with video details
    const [updatedVideo] = await getDB()
      .update(video)
      .set({
        status: "pending_upload",
        script,
        source_url: shortUrl,
        title: script,
        description: script,
        video_path: videoPath,
        updated_at: new Date(),
      })
      .where(eq(video.id, entry.id))
      .returning()

    return updatedVideo
  } catch (error) {
    consola.error(`Failed to generate video ID ${entry.id}:`, error)
    await updateVideoStatus(entry.id, "failed" as const)
    throw error
  }
}
