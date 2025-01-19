import { defineCommand } from "citty"
import { consola } from "consola"
import { Buffer } from "node:buffer"
import { copyFile, writeFile } from "node:fs/promises"

import { downloadVideo } from "~/lib/download-video"
import { MIME_TYPES } from "~/lib/mime-types"
import { ensureDirectories, PATHS } from "~/lib/paths"
import { generateAudio } from "~/modules/audio-generator/main"
import { fileManager } from "~/modules/script-generator/lib/file-manager"
import { generateScript } from "~/modules/script-generator/main"
import { findRandomShort } from "~/modules/video-finder/main"
import { renderVideo } from "~/modules/video-renderer/main"
import { uploadVideo } from "~/modules/video-uploader/main"

export const generate = defineCommand({
  meta: {
    name: "generate",
    description: "Trigger a new video generation",
  },
  args: {
    upload: {
      alias: "u",
      type: "boolean",
      description: "Upload the generated video to YouTube",
      default: false,
    },
  },
  async run({ args: { upload: shouldUpload } }) {
    consola.info("Ensuring required directories exist...")
    await ensureDirectories()
    consola.success("Directories created successfully")

    consola.info("Finding random YouTube Short...")
    const shortUrl = await findRandomShort()
    consola.success(`Found Short: ${shortUrl}`)

    consola.info("Starting video download...")
    const location = await downloadVideo({
      url: shortUrl,
    })

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

    consola.info("Generating audio from script...")
    const { audio, subtitle } = await generateAudio(script)
    consola.success("Audio generation completed")
    const audioBuffer = Buffer.from(await audio.arrayBuffer())

    consola.info("Saving assets to disk...")
    await copyFile(location, PATHS.VIDEO_PATH)
    await writeFile(PATHS.AUDIO_PATH, audioBuffer)
    await writeFile(PATHS.SUBTITLE_PATH, JSON.stringify(subtitle))
    consola.success("Assets saved successfully")

    consola.info("Rendering final video...")
    const result = await renderVideo()
    consola.success("Video rendering completed")

    if (shouldUpload) {
      consola.info("Uploading video to YouTube...")
      const videoBlob = new Blob([new Uint8Array(result.buffer)], {
        type: "video/mp4",
      })
      await uploadVideo({
        video: videoBlob,
        title: script,
        description: script,
        privacyStatus: "unlisted",
      })
    } else {
      consola.info("Saving final video...")
      await writeFile(PATHS.outputPath(script), Buffer.from(result.buffer))
      consola.success("Final video saved successfully")
    }

    consola.info("Cleaning up temporary files...")
    await fileManager.deleteAllFiles()
    consola.success("Cleanup completed")
  },
})
