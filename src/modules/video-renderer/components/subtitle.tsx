import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion"

import { Word } from "./word"

interface Props {
  text: string
}

export function Subtitle({ text }: Props) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const enter = spring({
    config: {
      damping: 200,
    },
    durationInFrames: 5,
    fps,
    frame,
  })

  return (
    <AbsoluteFill>
      <AbsoluteFill>
        <Word stroke enterProgress={enter} text={text} />
      </AbsoluteFill>
      <AbsoluteFill>
        <Word enterProgress={enter} stroke={false} text={text} />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
