import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"

import { PATHS } from "~/lib/paths"

const sqlite = new Database(PATHS.DB_PATH)

export const db = drizzle(sqlite)
