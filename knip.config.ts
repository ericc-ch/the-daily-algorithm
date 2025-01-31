import type { KnipConfig } from "knip"

export default {
  entry: [
    "./src/main.ts",
    "./src/modules/video-renderer/remotion-entry.ts",
    "./remotion.config.ts",
  ],
} satisfies KnipConfig
