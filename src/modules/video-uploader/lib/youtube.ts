import { consola } from "consola"
import { createReadStream } from "fs"
import { google } from "googleapis"

export interface VideoMetadata {
  title: string
  description?: string
  privacyStatus?: "private" | "unlisted" | "public"
}

interface UploadOptions extends VideoMetadata {
  videoPath: string
}

export async function uploadToYoutube(
  accessToken: string,
  { videoPath, privacyStatus = "public", ...metadata }: UploadOptions,
) {
  const youtube = google.youtube("v3")
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })

  consola.info("Initiating video upload to YouTube...")

  try {
    const mediaBody = createReadStream(videoPath)

    const response = await youtube.videos.insert({
      auth,
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: metadata.title,
          description: metadata.description,
        },
        status: {
          privacyStatus,
        },
      },
      media: {
        body: mediaBody,
      },
    })

    if (!response.data.id) {
      throw new Error("Upload successful but no video ID returned")
    }

    return {
      id: response.data.id,
      snippet: response.data.snippet,
      status: response.data.status,
    }
  } catch (error) {
    consola.error("Upload failed:", error)
    throw error
  }
}
