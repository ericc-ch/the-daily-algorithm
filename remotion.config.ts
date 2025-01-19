import { Config } from "@remotion/cli/config"
import os from "node:os"
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin"

import { PATHS } from "~/lib/paths"

Config.setEntryPoint("./src/modules/video-renderer/remotion-entry.ts")
Config.setPublicDir(PATHS.REMOTION_PUBLIC_DIR)
Config.setOutputLocation(PATHS.OUTPUT_DIR)

Config.setBrowserExecutable("chromium")
Config.setConcurrency(os.cpus().length)
Config.setChromiumOpenGlRenderer("vulkan")
Config.setX264Preset("veryfast")
Config.setHardwareAcceleration("if-possible")

Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    plugins: [...(config.resolve?.plugins ?? []), new TsconfigPathsPlugin()],
  },
}))
