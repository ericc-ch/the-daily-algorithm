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
const REMOTION_PUBLIC_DIR = path.join(APP_DIR, "remotion", "public")
const REMOTION_OUTPUT_DIR = path.join(APP_DIR, "remotion", "output")

const DB_PATH = path.join(APP_DIR, "db.sqlite")

export const PATHS = {
  APP_DIR,
  CACHE_DIR,
  REMOTION_PUBLIC_DIR,
  REMOTION_OUTPUT_DIR,
  DB_PATH,
}

export async function ensureDirectories(): Promise<void> {
  await Promise.all([
    fs.mkdir(APP_DIR, { recursive: true }),
    fs.mkdir(CACHE_DIR, { recursive: true }),
    fs.mkdir(REMOTION_PUBLIC_DIR, { recursive: true }),
    fs.mkdir(REMOTION_OUTPUT_DIR, { recursive: true }),
  ])
}
