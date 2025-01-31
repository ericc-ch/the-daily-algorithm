import ytdl from "@distube/ytdl-core"
import { consola } from "consola"
import { createWriteStream } from "node:fs"
import { access } from "node:fs/promises"
import { join } from "node:path"

import { CacheManager } from "./cache-manager"
import { PATHS } from "./paths"

interface DownloadOptions {
  url: string
  musicOnly?: boolean
  useCache?: boolean
}

interface VideoCache {
  path: string
}

const videoCache = new CacheManager("video", {
  ttl: 24 * 60 * 60 * 1000, // 24 hours by default
})

export async function downloadVideo({
  url,
  musicOnly = false,
  useCache = true,
}: DownloadOptions): Promise<string> {
  const cacheKey = `${url}-${musicOnly ? "music" : "video"}`

  // Check cache if enabled
  if (useCache) {
    consola.debug(`Checking cache for key: ${cacheKey}`)
    const cached = await videoCache.get(cacheKey)
    if (cached) {
      const videoCacheData = JSON.parse(cached) as VideoCache
      try {
        await access(videoCacheData.path)
        consola.success(`Found cached video at: ${videoCacheData.path}`)
        return videoCacheData.path
      } catch {
        consola.warn(`Cached file not found at: ${videoCacheData.path}`)
      }
    }
  }

  consola.info(`Downloading video from: ${url}`)
  const outputDir = join(PATHS.CACHE_DIR, "videos")
  const outputPath = join(outputDir, `${btoa(cacheKey)}.mp4`)
  consola.debug(`Using cache directory: ${outputDir}`)

  const stream = ytdl(url, {
    quality: musicOnly ? "highestaudio" : "highest",
    filter: musicOnly ? "audioonly" : "audioandvideo",
  })

  // Create a write stream to save the video
  const writeStream = createWriteStream(outputPath)

  // Return a promise that resolves when the download is complete
  return new Promise((resolve, reject) => {
    stream.pipe(writeStream)

    stream.on("error", (error) => {
      reject(error)
    })

    writeStream.on("finish", async () => {
      consola.success(`Video downloaded successfully to: ${outputPath}`)
      await videoCache.set(cacheKey, JSON.stringify({ path: outputPath }))
      resolve(outputPath)
    })
  })
}
