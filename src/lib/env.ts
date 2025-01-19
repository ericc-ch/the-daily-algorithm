import { getEnv } from "@echristian/env"

const GEMINI_API_KEY = getEnv("GEMINI_API_KEY")

const GOOGLE_CLIENT_ID = getEnv("GOOGLE_CLIENT_ID")
const GOOGLE_CLIENT_SECRET = getEnv("GOOGLE_CLIENT_SECRET")

export const ENV = {
  GEMINI_API_KEY,

  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
}
