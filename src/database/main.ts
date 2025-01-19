import { drizzle } from "drizzle-orm/libsql"

import { PATHS } from "~/lib/paths"

let db: ReturnType<typeof drizzle> | null = null

export function initializeDB() {
  db = drizzle({
    connection: {
      url: `file:${PATHS.DB_PATH}`,
    },
  })
  return db
}

export function getDB() {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDB() first.")
  }
  return db
}
