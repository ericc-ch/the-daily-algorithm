import { defineCommand, runMain } from "citty"

import { auth } from "./commands/auth"
import { generate } from "./commands/generate"
import { start } from "./commands/start"

const cli = defineCommand({
  meta: {
    name: "tda",
    description: "The Daily Algorithm content generator",
  },
  subCommands: {
    generate,
    auth,
    start,
  },
})

export const runCLI = () => runMain(cli)
