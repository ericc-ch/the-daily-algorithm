import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const video = sqliteTable("video", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),

  title: text("title").notNull(),
  description: text("description").notNull(),
  script: text("script").notNull(),
  source_url: text("source_url").notNull(),

  status: text("status", {
    enum: [
      "pending",
      "processing_script",
      "processing_audio",
      "processing_video",
      "processing_upload",
      "uploaded",
    ],
  }).default("pending"),

  created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updated_at: integer("updated_at", { mode: "timestamp" }).$onUpdateFn(
    () => new Date(),
  ),
})

export type Video = typeof video.$inferSelect
export type InsertVideo = typeof video.$inferInsert
