import { defineCommand } from "citty"
import { consola } from "consola"
import { existsSync } from "node:fs"

import { uploadVideo } from "~/modules/video-uploader/main"

import { generateVideo } from "../lib/generate-video"

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
    try {
      const video = await generateVideo()

      if (shouldUpload) {
        const { video_path, title, description } = video

        if (!video_path || !title || !description) {
          throw new Error("Missing required metadata for upload")
        }

        if (!existsSync(video_path)) {
          throw new Error(`Video file not found at path: ${video_path}`)
        }

        await uploadVideo({
          videoPath: video_path,
          title,
          description,
          privacyStatus: "public",
        })
      }
    } catch (error) {
      consola.error("Video generation/upload process failed:", error)
      process.exit(1)
    }
  },
})
