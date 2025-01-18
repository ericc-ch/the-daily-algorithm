import { renderMedia, selectComposition } from "@remotion/renderer"
import consola from "consola"
import os from "node:os"

import type { ViralVideoProps } from "../compositions/viral-video"

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
    onProgress: ({ progress }) => {
      const intProgress = Math.round(progress * 100)
      consola.info(`Render progress: ${intProgress}%`)
    },
  })

  if (!renderResult.buffer) {
    throw new Error("Video without output location must return buffer")
  }

  return renderResult.buffer
}
