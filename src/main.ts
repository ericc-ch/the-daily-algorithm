import { runCLI } from "./modules/cli/main"

await runCLI()
import { runMigrations } from "./database/migrations"
import { runCLI } from "./modules/cli/main"

async function main() {
  await runMigrations()
  await runCLI()
}

main().catch((error) => {
  console.error("Application failed:", error)
  process.exit(1)
})
