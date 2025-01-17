import { defineCommand, runMain } from "citty"

const cli = defineCommand({
  meta: {
    name: "tda",
    description: "The Daily Algorithm content generator",
  },
})

export const runCLI = () => runMain(cli)
