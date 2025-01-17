import type { FileMetadataResponse } from "@google/generative-ai/server"

import { model } from "./lib/model"
import { PROMPTS } from "./lib/prompts"

export async function generateCrackBotReaction(
  video: FileMetadataResponse,
): Promise<string> {
  const session = model.startChat({
    generationConfig: { temperature: 2 },
  })

  const reply = await session.sendMessage([
    {
      fileData: {
        fileUri: video.uri,
        mimeType: video.mimeType,
      },
    },
    PROMPTS.USER_PROMPT,
  ])

  return reply.response.text()
}
