import { getEnv } from "@echristian/env"

const GEMINI_API_KEY = getEnv("GEMINI_API_KEY")

export const ENV = {
  GEMINI_API_KEY,
}
