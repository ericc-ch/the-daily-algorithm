import { sqliteTable } from "drizzle-orm/sqlite-core"

export const video = sqliteTable("video", {})

export type Queue = typeof video.$inferSelect
