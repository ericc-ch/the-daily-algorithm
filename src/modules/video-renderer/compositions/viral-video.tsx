import { AbsoluteFill, Audio, Sequence } from "remotion"
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

  durationInFrames: z.number().int(),
  durationInMs: z.number().int(),
})

export type ViralVideoProps = z.infer<typeof viralVideoSchema>

export function ViralVideo({
  audioSrc,
  videoSrc,
  subtitles,
  durationInFrames,
  durationInMs,
}: ViralVideoProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: "white" }}>
      <Audio src={audioSrc} />

      <AbsoluteFill style={{ top: "65%" }}>
        {subtitles.map((subtitle, index) => (
          <Sequence
            key={index}
            durationInFrames={subtitle.duration / durationInFrames}
            from={subtitle.start / durationInFrames}
          >
            <Subtitle text={subtitle.text} />
          </Sequence>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
