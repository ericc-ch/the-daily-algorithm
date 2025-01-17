import type { FileMetadataResponse } from "@google/generative-ai/server"

import { consola } from "consola"

import { model } from "./lib/model"
import { PROMPTS } from "./lib/prompts"

export async function generateScript(
  video: FileMetadataResponse,
): Promise<string> {
  consola.info("Starting script generation for video", video.uri)

  const session = model.startChat({
    generationConfig: { temperature: 1.5 },
  })

  consola.debug("Sending prompt to model")
  const reply = await session.sendMessage([
    {
      fileData: {
        fileUri: video.uri,
        mimeType: video.mimeType,
      },
    },
    PROMPTS.USER_PROMPT,
  ])

  const script = reply.response.text()
  consola.success("Script generated successfully")

  return script
}
