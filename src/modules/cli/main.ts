import { defineCommand, runMain } from "citty"
import { consola } from "consola"

import { fileManager } from "~/modules/script-generator/lib/file-manager"

import { auth } from "./commands/auth"
import { generate } from "./commands/generate"
import { prune } from "./commands/prune"
import { start } from "./commands/start/command"

const cli = defineCommand({
  meta: {
    name: "tda",
    description: "The Daily Algorithm content generator",
  },
  subCommands: {
    generate,
    auth,
    start,
    prune,
  },
})

export const runCLI = () => runMain(cli)
