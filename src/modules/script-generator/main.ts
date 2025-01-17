import type { GenerationConfig, StartChatParams } from "@google/generative-ai"
import type { FileMetadataResponse } from "@google/generative-ai/server"

import { model } from "./lib/model"

const GEMINI_CONFIG = {
  generation: {
    temperature: 2,
  } as const satisfies GenerationConfig,
} as const

type MessageContent = Array<{
  fileData: {
    fileUri: string
    mimeType: string
  }
}>

const createChatSession = (
  params?: Omit<StartChatParams, "generationConfig">,
) =>
  model.startChat({
    generationConfig: GEMINI_CONFIG.generation,
    ...params,
  })

interface GenerateReactionOptions {
  file: FileMetadataResponse
}

export async function generateCrackBotReaction({
  file,
}: GenerateReactionOptions): Promise<string> {
  const session = createChatSession()

  const messageContent: MessageContent = [
    {
      fileData: {
        fileUri: file.uri,
        mimeType: file.mimeType,
      },
    },
  ]

  try {
    const reply = await session.sendMessage(messageContent)
    return reply.response.text()
  } catch (error) {
    throw new Error("")
  }
}
