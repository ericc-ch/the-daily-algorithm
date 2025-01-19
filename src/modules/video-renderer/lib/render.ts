import { renderMedia, selectComposition } from "@remotion/renderer"
import consola from "consola"

import { getConfig } from "~/lib/config"

import type { ViralVideoProps } from "../compositions/viral-video"

function createProgressCallback() {
  let lastProgress = -1
  return ({ progress }: { progress: number }) => {
    const intProgress = Math.round(progress * 100)
    if (intProgress !== lastProgress) {
      consola.info(`Render progress: ${intProgress}%`)
      lastProgress = intProgress
    }
  }
}

export async function renderVideoMedia(
  composition: Awaited<ReturnType<typeof selectComposition>>,
  bundleLocation: string,
  inputProps: Partial<ViralVideoProps>,
) {
  // DAMN YOU GOOGLE
  // https://www.remotion.dev/docs/miscellaneous/chrome-headless-shell#what-is-chrome-headless-shell
  // https://developer.chrome.com/docs/chromium/headless
  // const browserExecutable = await getChromiumPath()

  const renderResult = await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    inputProps,
    concurrency: getConfig().concurrency,
    hardwareAcceleration: "if-possible",
    x264Preset: "veryfast",
    // ...(browserExecutable && { browserExecutable }),
    chromiumOptions: {
      gl: "vulkan",
    },
    onProgress: createProgressCallback(),
  })

  if (!renderResult.buffer) {
    throw new Error("Video without output location must return buffer")
  }

  return renderResult.buffer
}
