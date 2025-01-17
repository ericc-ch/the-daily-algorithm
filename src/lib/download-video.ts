import spawn from "nano-spawn"
import { existsSync } from "node:fs"

import { CacheManager } from "./cache-manager"
import { createTempDir } from "./temp"

interface DownloadOptions {
  url: string
  withMusic?: boolean
  useCache?: boolean
  cacheTTL?: number // Time to live in milliseconds
}

interface VideoCache {
  path: string
}

const videoCache = new CacheManager<VideoCache>("video", {
  ttl: 24 * 60 * 60 * 1000, // 24 hours by default
})

export async function downloadVideo({
  url,
  withMusic = false,
  useCache = true,
  cacheTTL,
}: DownloadOptions): Promise<string> {
  const cacheKey = `${url}-${withMusic ? "music" : "video"}`

  // Check cache if enabled
  if (useCache) {
    const cached = await videoCache.get(cacheKey)
    if (cached && existsSync(cached.path)) {
      return cached.path
    }
  }

  const outputDir = await createTempDir("video-download-")

  const proc = await spawn("yt-dlp", [
    "--paths",
    outputDir,
    "--output",
    `${globalThis.crypto.randomUUID()}.%(ext)s`,
    "--format",
    "mp4",
    ...(withMusic ? ["-x"] : []),
    url,
  ])

  await proc.exited

  const output = await new Response(proc.stdout).text()
  const downloadLine = output.split("[download]").map((line) => line.trim())[1]
  const location = downloadLine.split("Destination: ")[1]

  // Update cache if enabled
  if (useCache) {
    await videoCache.set(cacheKey, { path: location })
  }

  return location
}
