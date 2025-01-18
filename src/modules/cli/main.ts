import { defineCommand, runMain } from "citty"

import { generate } from "./commands/generate"

const cli = defineCommand({
  meta: {
    name: "tda",
    description: "The Daily Algorithm content generator",
  },
  subCommands: {
    generate,
  },
})

export const runCLI = () => runMain(cli)
