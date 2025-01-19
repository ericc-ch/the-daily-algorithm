import { defineCommand, runMain } from "citty"
import { consola } from "consola"

import { fileManager } from "~/modules/script-generator/lib/file-manager"

import { auth } from "./commands/auth"
import { generate } from "./commands/generate"
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
  },
  cleanup: async () => {
    consola.info("Cleaning up temporary files...")
    await fileManager.deleteAllFiles()
    consola.success("Cleanup completed")
  },
})

export const runCLI = () => runMain(cli)
