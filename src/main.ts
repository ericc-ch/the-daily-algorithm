import { consola } from "consola"

import { ensureDirectories } from "~/lib/paths"

import { runCLI } from "./modules/cli/main"

async function main() {
  // Add setup here
  consola.info("Ensuring required directories exist...")
  await ensureDirectories()
  consola.success("Directories created successfully")

  await runCLI()
}

main().catch((error: unknown) => {
  console.error("Application failed:", error)
  process.exit(1)
})
