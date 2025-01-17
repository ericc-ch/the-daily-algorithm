import os from "node:os"
import path from "pathe"

const APP_DIR = path.join(
  os.homedir(),
  ".local",
  "share",
  "the-daily-algorithm",
)

const DB_PATH = path.join(APP_DIR, "db.sqlite")

export const PATHS = {
  APP_DIR,
  DB_PATH,
}
