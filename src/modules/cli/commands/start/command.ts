import { defineCommand } from "citty"

import { generate } from "./generate"
import { upload } from "./upload"

export const start = defineCommand({
  meta: {
    name: "start",
    description: "Start services",
  },
  subCommands: {
    generate,
    upload,
  },
})
