import { loadFont } from "@remotion/google-fonts/Montserrat"
import { fitText } from "@remotion/layout-utils"
import { AbsoluteFill, useVideoConfig } from "remotion"

const { fontFamily } = loadFont()

interface Props {
  text: string
}

export function Subtitle({ text }: Props) {
  const { width } = useVideoConfig()
  const desiredFontSize = 80

  const fittedText = fitText({
    fontFamily,
    text,
    withinWidth: width * 0.75,
  })

  const fontSize = Math.min(desiredFontSize, fittedText.fontSize)

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
