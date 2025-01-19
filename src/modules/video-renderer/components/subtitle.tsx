import { loadFont } from "@remotion/google-fonts/Montserrat"
import { fitText } from "@remotion/layout-utils"
import { useMemo } from "react"
import { AbsoluteFill, useVideoConfig } from "remotion"

const { fontFamily } = loadFont()

interface Props {
  text: string
}

const DESIRED_FONT_SIZE = 80

export function Subtitle({ text }: Props) {
  const { width } = useVideoConfig()

  const fittedText = useMemo(
    () =>
      fitText({
        fontFamily,
        text,
        withinWidth: width * 0.75,
      }),
    [text, width],
  )

  const fontSize = useMemo(
    () => Math.min(DESIRED_FONT_SIZE, fittedText.fontSize),
    [fittedText.fontSize],
  )

  return (
    <AbsoluteFill style={{ display: "grid", placeContent: "center" }}>
      <div
        style={{
          fontFamily,
          fontSize,
          fontWeight: "bold",

          width: "max-content",

          backgroundColor: "#1f1f1f",
          color: "#EBEBEB",

          textAlign: "center",
          textTransform: "uppercase",

          paddingBlock: 4,
          paddingInline: 16,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  )
}
