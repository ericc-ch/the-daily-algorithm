import { defineCommand, runMain } from "citty"

import { auth } from "./commands/auth"
import { generate } from "./commands/generate"

const cli = defineCommand({
  meta: {
    name: "tda",
    description: "The Daily Algorithm content generator",
  },
  subCommands: {
    generate,
    auth,
  },
})

export const runCLI = () => runMain(cli)
