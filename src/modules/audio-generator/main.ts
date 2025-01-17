import { generate } from "@echristian/edge-tts"
import consola from "consola"

export async function generateAudio(script: string) {
  consola.info("Generating audio from script")

  try {
    const audio = await generate({
      text: script,
    })
    consola.success("Audio generation completed")
    return audio
  } catch (error) {
    consola.error("Failed to generate audio:", error)
    throw error
  }
}
