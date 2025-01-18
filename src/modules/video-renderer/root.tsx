import { getVideoMetadata } from "@remotion/media-utils"
import { Composition, staticFile } from "remotion"

import { PATHS } from "~/lib/paths"

import { ViralVideo, viralVideoSchema } from "./compositions/viral-video"

const FPS = 60

export function Root() {
  return (
    <Composition
      calculateMetadata={async ({ props }) => {
        const videoMetadata = await getVideoMetadata(props.videoSrc)
        const videoDurationInFrames = videoMetadata.durationInSeconds * FPS

        const durationInFrames = Math.ceil(videoDurationInFrames)
        const durationInMs = (durationInFrames / FPS) * 1000

        return {
          props: {
            ...props,
            durationInFrames,
            durationInMs,
          },
          durationInFrames,
        }
      }}
      component={ViralVideo}
      defaultProps={{
        audioSrc: staticFile(PATHS.AUDIO_FILE_NAME),
        videoSrc: staticFile(PATHS.VIDEO_FILE_NAME),
        durationInMs: 0,
        durationInFrames: 0,
        subtitles: [],
      }}
      fps={FPS}
      height={1080}
      id="viral-video"
      schema={viralVideoSchema}
      width={1920}
    />
  )
}
