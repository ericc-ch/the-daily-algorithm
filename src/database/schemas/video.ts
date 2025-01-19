import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const video = sqliteTable("video", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),

  title: text("title"),
  description: text("description"),
  script: text("script"),
  source_url: text("source_url"),

  status: text("status", {
    enum: [
      "pending_video",
      "pending_script",
      "pending_audio",
      "pending_render",
      "pending_upload",
      "completed",
    ],
  }).default("pending_video"),

  created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updated_at: integer("updated_at", { mode: "timestamp" }).$onUpdateFn(
    () => new Date(),
  ),
})

export type Video = typeof video.$inferSelect
export type InsertVideo = typeof video.$inferInsert
