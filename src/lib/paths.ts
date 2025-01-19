import { consola } from "consola"
import fs from "node:fs/promises"
import os from "node:os"
import path from "pathe"

const APP_DIR = path.join(
  os.homedir(),
  ".local",
  "share",
  "the-daily-algorithm",
)
const CACHE_DIR = path.join(os.homedir(), ".cache", "the-daily-algorithm")

const OUTPUT_DIR = path.join(APP_DIR, "output")
const outputPath = (title: string) => path.join(OUTPUT_DIR, `${title}.mp4`)

const REMOTION_PUBLIC_DIR = path.join(APP_DIR, "remotion", "public")

const AUDIO_FILE_NAME = "audio.mp3"
const AUDIO_PATH = path.join(REMOTION_PUBLIC_DIR, AUDIO_FILE_NAME)

const SUBTITLE_FILE_NAME = "subtitles.json"
const SUBTITLE_PATH = path.join(REMOTION_PUBLIC_DIR, SUBTITLE_FILE_NAME)

const VIDEO_FILE_NAME = "video.mp4"
const VIDEO_PATH = path.join(REMOTION_PUBLIC_DIR, VIDEO_FILE_NAME)

const TOKEN_PATH = path.join(APP_DIR, "token.json")
const DB_PATH = path.join(APP_DIR, "db.sqlite")

export const PATHS = {
  APP_DIR,
  CACHE_DIR,

  OUTPUT_DIR,
  outputPath,

  REMOTION_PUBLIC_DIR,

  AUDIO_FILE_NAME,
  AUDIO_PATH,

  SUBTITLE_FILE_NAME,
  SUBTITLE_PATH,

  VIDEO_FILE_NAME,
  VIDEO_PATH,

  TOKEN_PATH,
  DB_PATH,
}

export async function ensureDirectories(): Promise<void> {
  // Ensure all directories exist
  await Promise.all([
    fs.mkdir(APP_DIR, { recursive: true }),
    fs.mkdir(CACHE_DIR, { recursive: true }),
    fs.mkdir(REMOTION_PUBLIC_DIR, { recursive: true }),
    fs.mkdir(OUTPUT_DIR, { recursive: true }),
  ])

  // Ensure database file exists by touching it (creates if doesn't exist, updates timestamp if it does)
  try {
    const handle = await fs.open(DB_PATH, "a")
    await handle.close()
  } catch (error) {
    consola.error(`Failed to ensure database file exists at ${DB_PATH}:`, error)
    throw error
  }
}
