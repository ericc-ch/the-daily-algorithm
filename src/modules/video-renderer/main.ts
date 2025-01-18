import path from "pathe"

import { PATHS } from "~/lib/paths"

import type { ViralVideoProps } from "./compositions/viral-video"

import { createBundle } from "./lib/bundle"
import { createComposition } from "./lib/composition"
import { renderVideoMedia } from "./lib/render"
import { loadSubtitles } from "./lib/subtitles"

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
