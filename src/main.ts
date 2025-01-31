import { consola } from "consola"

import { ensureDirectories } from "~/lib/paths"
import { fileManager } from "~/modules/script-generator/lib/file-manager"

import { initializeDB } from "./database/main"
import { runCLI } from "./modules/cli/main"

async function initialize() {
  consola.level = 4

  consola.info("Ensuring required directories exist...")
  await ensureDirectories()
  consola.success("Directories created successfully")

  consola.info("Initializing database connection...")
  initializeDB()
  consola.success("Database initialized successfully")
}

async function cleanup() {
  consola.info("Cleaning up temporary files...")
  await fileManager.deleteAllFiles()
  consola.success("Cleanup completed")
}

// Setup cleanup on process exit
process.on("SIGINT", cleanup)
process.on("SIGTERM", cleanup)

async function main() {
  await initialize()
  await runCLI()
}

main().catch((error: unknown) => {
  console.error("Application failed:", error)
  process.exit(1)
})
