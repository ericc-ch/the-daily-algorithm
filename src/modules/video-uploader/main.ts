import { consola } from "consola"

import { getValidAccessToken } from "./lib/auth"

export async function uploadVideo() {
  try {
    const accessToken = await getValidAccessToken()
    consola.success("Successfully authenticated with Google")
    // TODO: Implement video upload logic using the accessToken
  } catch (error) {
    consola.error("Authentication failed:", error)
    throw error
  }
}
