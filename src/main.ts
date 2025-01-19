import { consola } from "consola"

import { ensureDirectories } from "~/lib/paths"

import { initializeDB } from "./database/main"
import { runCLI } from "./modules/cli/main"

async function initialize() {
  consola.info("Ensuring required directories exist...")
  await ensureDirectories()
  consola.success("Directories created successfully")

  consola.info("Initializing database connection...")
  initializeDB()
  consola.success("Database initialized successfully")
}

async function main() {
  await initialize()
  await runCLI()
}

main().catch((error: unknown) => {
  console.error("Application failed:", error)
  process.exit(1)
})
