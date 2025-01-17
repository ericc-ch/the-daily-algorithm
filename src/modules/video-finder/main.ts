import { sleep } from "~/lib/sleep"

import { createPage } from "./lib/browser"

const { page, cleanup } = await createPage()
await page.goto("https://www.youtube.com/shorts")

await sleep(10_000)

await cleanup()
