import { selectComposition } from "@remotion/renderer"

import type { ViralVideoProps } from "../compositions/viral-video"

export interface CompositionOptions {
  bundleLocation: string
  inputProps: Partial<ViralVideoProps>
}

export async function createComposition({
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
