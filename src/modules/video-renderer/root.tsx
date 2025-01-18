import { getAudioData, getVideoMetadata } from "@remotion/media-utils"
import { Composition, staticFile } from "remotion"

import { ViralVideo, viralVideoSchema } from "./compositions/viral-video"

const FPS = 60

export function Root() {
  return (
    <Composition
      calculateMetadata={async ({ props }) => {
        const videoMetadata = await getVideoMetadata(staticFile(props.videoSrc))
        const videoDurationInFrames = videoMetadata.durationInSeconds * FPS

        const audioMetadata = await getAudioData(staticFile(props.audioSrc))

        const durationInFrames = Math.ceil(videoDurationInFrames)

        return {
          props: {
            ...props,
            audioLength: audioMetadata.durationInSeconds * FPS,
          },
          durationInFrames,
        }
      }}
      component={ViralVideo}
      defaultProps={{
        audioLength: 0,
        audioSrc: "audio.mp3",
        videoSrc: "video.mp4",
        subtitles: [
          {
            text: "These knock-knock jokes",
            start: 100,
            duration: 1162,
            end: 1262,
          },
          { text: "are in another", start: 1275, duration: 674, end: 1949 },
          { text: "language", start: 1962, duration: 612, end: 2574 },
        ],
      }}
      fps={FPS}
      height={1920}
      id="viral-video"
      schema={viralVideoSchema}
      width={1080}
    />
  )
}
