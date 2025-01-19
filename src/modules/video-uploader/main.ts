import { consola } from "consola"

import { getValidAccessToken } from "./lib/auth"
import { uploadToYoutube, type VideoMetadata } from "./lib/youtube"

interface UploadVideoOptions extends VideoMetadata {
  video: string | Blob
}

export async function uploadVideo({ video, ...metadata }: UploadVideoOptions) {
  const attemptUpload = async (retrying = false) => {
    try {
      const accessToken = await getValidAccessToken()
      if (retrying) {
        consola.info("Retrying video upload with new authentication...")
      } else {
        consola.info("Starting video upload to YouTube...")
      }

      const result = await uploadToYoutube(accessToken, {
        video,
        ...metadata,
      })

      consola.success("Video uploaded successfully!", {
        videoId: result.id,
        url: `https://youtu.be/${result.id}`,
      })

      return result
    } catch (error) {
      if (!retrying) {
        // Retry once with fresh authentication
        return attemptUpload(true)
      }

      consola.error("Video upload failed:", error)
      throw error
    }
  }

  return attemptUpload()
}
