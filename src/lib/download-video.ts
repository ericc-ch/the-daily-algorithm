import { consola } from "consola"
import spawn from "nano-spawn"
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
  consola.debug(`Using cache directory: ${outputDir}`)

  const { output } = await spawn("yt-dlp", [
    // Specify the directory to save the downloaded files
    "--paths",
    outputDir,

    // Set the output filename template - use deterministic name based on URL
    "--output",
    // Use URL hash and music flag for filename, %(ext)s is replaced with file extension
    `${btoa(cacheKey)}.%(ext)s`,

    // Download in MP4 format
    "--format",
    "mp4",

    // If withMusic is true, add -x flag
    ...(musicOnly ?
      // -x extracts audio from video
      ["-x"]
    : []),

    // The video URL to download
    url,
  ])

  const downloadLine = output.split("[download]").map((line) => line.trim())[1]
  const location = downloadLine.split("Destination: ")[1]

  consola.success(`Video downloaded successfully to: ${location}`)
  await videoCache.set(cacheKey, JSON.stringify({ path: location }))

  return location
}
