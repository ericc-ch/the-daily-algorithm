import { drizzle } from "drizzle-orm/libsql"

import { PATHS } from "~/lib/paths"

export const db = drizzle({
  connection: {
    url: `file:${PATHS.DB_PATH}`,
  },
})
