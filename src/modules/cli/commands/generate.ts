import { defineCommand } from "citty"
import { generateVideo } from "../lib/generate-video"

export const generate = defineCommand({
  meta: {
    name: "generate",
    description: "Trigger a new video generation",
  },
  args: {
    upload: {
      alias: "u",
      type: "boolean",
      description: "Upload the generated video to YouTube",
      default: false,
    },
  },
  async run({ args: { upload: shouldUpload } }) {
    await generateVideo(shouldUpload)
  },
})
