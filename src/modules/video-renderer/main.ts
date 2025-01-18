import type { ParseSubtitleResult } from "@echristian/edge-tts"

import { bundle } from "@remotion/bundler"
import { renderMedia, selectComposition } from "@remotion/renderer"
import consola from "consola"
import { readFile } from "node:fs/promises"
import os from "node:os"
import path from "pathe"
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin"

import { PATHS } from "~/lib/paths"

import type { ViralVideoProps } from "./compositions/viral-video"

export async function renderVideo() {
  const fileContent = await readFile(PATHS.SUBTITLE_PATH, "utf-8")
  const subtitles = JSON.parse(fileContent) as Array<ParseSubtitleResult>

  const entryPoint = path.join(import.meta.dirname, "remotion-entry.ts")

  const bundleLocation = await bundle({
    entryPoint,
    publicDir: PATHS.REMOTION_PUBLIC_DIR,
    onProgress: (progress) => {
      consola.info(`Bundle progress: ${progress}%`)
    },
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        plugins: [
          ...(config.resolve?.plugins ?? []),
          new TsconfigPathsPlugin(),
        ],
      },
    }),
  })

  const inputProps: Partial<ViralVideoProps> = {
    audioSrc: PATHS.AUDIO_FILE_NAME,
    videoSrc: PATHS.VIDEO_FILE_NAME,
    subtitles,
  }

  const composition = await selectComposition({
    id: "viral-video",
    serveUrl: bundleLocation,
    inputProps,
    chromeMode: "chrome-for-testing",
  })

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

  if (!renderResult.buffer)
    throw new Error("Video without output location must return buffer")

  return renderResult.buffer
}
