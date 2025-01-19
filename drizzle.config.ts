import { defineConfig } from "drizzle-kit"

import { PATHS } from "./src/lib/paths"

// Using npx because of this issue
// https://github.com/oven-sh/bun/issues/7343

export default defineConfig({
  out: "./drizzle",
  schema: "./src/database/schemas/*",
  dialect: "sqlite",
  dbCredentials: {
    url: PATHS.DB_PATH,
  },
})
