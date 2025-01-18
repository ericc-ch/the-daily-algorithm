import type { ParseSubtitleResult } from "@echristian/edge-tts"

import { readFile } from "node:fs/promises"

import { PATHS } from "~/lib/paths"

export async function loadSubtitles(): Promise<Array<ParseSubtitleResult>> {
  const fileContent = await readFile(PATHS.SUBTITLE_PATH, "utf-8")
  return JSON.parse(fileContent) as Array<ParseSubtitleResult>
}
