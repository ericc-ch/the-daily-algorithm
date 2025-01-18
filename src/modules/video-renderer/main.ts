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

interface BundleOptions {
  entryPoint: string
  publicDir: string
}

async function createBundle({ entryPoint, publicDir }: BundleOptions) {
  return bundle({
    entryPoint,
    publicDir,
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
}

interface CompositionOptions {
  bundleLocation: string
  inputProps: Partial<ViralVideoProps>
}

async function createComposition({
  bundleLocation,
  inputProps,
}: CompositionOptions) {
  return selectComposition({
    id: "viral-video",
    serveUrl: bundleLocation,
    inputProps,
    chromeMode: "chrome-for-testing",
  })
}

async function renderVideoMedia(
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

async function loadSubtitles(): Promise<Array<ParseSubtitleResult>> {
  const fileContent = await readFile(PATHS.SUBTITLE_PATH, "utf-8")
  return JSON.parse(fileContent) as Array<ParseSubtitleResult>
}

export async function renderVideo() {
  const subtitles = await loadSubtitles()

  const entryPoint = path.join(import.meta.dirname, "remotion-entry.ts")
  const bundleLocation = await createBundle({
    entryPoint,
    publicDir: PATHS.REMOTION_PUBLIC_DIR,
  })

  const inputProps: Partial<ViralVideoProps> = {
    audioSrc: PATHS.AUDIO_FILE_NAME,
    videoSrc: PATHS.VIDEO_FILE_NAME,
    subtitles,
  }

  const composition = await createComposition({ bundleLocation, inputProps })
  return renderVideoMedia(composition, bundleLocation, inputProps)
}
