import { useMemo } from "react"
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion"
import { z } from "zod"

import { Subtitle } from "../components/subtitle"

const subtitleCueSchema = z.object({
  text: z.string(),
  start: z.number().int(),
  duration: z.number().int(),
  end: z.number().int(),
})

export const viralVideoSchema = z.object({
  audioSrc: z.string().url(),
  videoSrc: z.string().url(),

  subtitles: z.array(subtitleCueSchema),

  audioLength: z.number().int(),
})

export type ViralVideoProps = z.infer<typeof viralVideoSchema>

export function ViralVideo({
  audioSrc,
  videoSrc,
  subtitles,
  audioLength,
}: ViralVideoProps) {
  const { fps } = useVideoConfig()

  // No need to memo this, it's gonna be rebuilt every frame anyway
  const msToFrames = (ms: number) => Math.floor((ms / 1000) * fps)

  const staticAudio = useMemo(() => staticFile(audioSrc), [audioSrc])
  const staticVideo = useMemo(() => staticFile(videoSrc), [videoSrc])

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Audio src={staticAudio} />

      <Sequence durationInFrames={audioLength}>
        <OffthreadVideo muted playbackRate={0.2} src={staticVideo} />
      </Sequence>

      <Sequence from={audioLength}>
        <OffthreadVideo src={staticVideo} />
      </Sequence>

      {subtitles.map((subtitle, index) => (
        <Sequence
          key={index}
          durationInFrames={msToFrames(subtitle.duration)}
          from={msToFrames(subtitle.start)}
        >
          <Subtitle text={subtitle.text} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
