import { runCLI } from "./modules/cli/main"

async function main() {
  await runCLI()
}

main().catch((error: unknown) => {
  console.error("Application failed:", error)
  process.exit(1)
})
