import { renderMedia, selectComposition } from "@remotion/renderer"
import consola from "consola"
import os from "node:os"

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
  const renderResult = await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    inputProps,
    concurrency: os.cpus().length,
    hardwareAcceleration: "if-possible",
    x264Preset: "veryfast",
    chromeMode: "chrome-for-testing",
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