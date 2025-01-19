import { createPage } from "./lib/browser"

/**
 * Finds a random YouTube Short by navigating to the YouTube Shorts page
 * and waiting for a redirect to a specific short video.
 *
 * @returns Promise that resolves to the URL of a random YouTube Short
 * @throws Will throw an error if unable to find a Short within the timeout period (60 seconds)
 *
 * @example
 * ```typescript
 * const shortUrl = await findRandomShort()
 * console.log(`Found Short: ${shortUrl}`)
 * ```
 */
export async function findRandomShort(): Promise<string> {
  const { page, cleanup } = await createPage()

  try {
    await page.goto("https://www.youtube.com/shorts", { timeout: 60_000 })
    await page.waitForURL(/\/shorts\/[^/]+/, { timeout: 60_000 })
    return page.url()
  } finally {
    await cleanup()
  }
}
