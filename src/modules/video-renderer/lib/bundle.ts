import { bundle } from "@remotion/bundler"
import consola from "consola"
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin"

export interface BundleOptions {
  entryPoint: string
  publicDir: string
}

export async function createBundle({ entryPoint, publicDir }: BundleOptions) {
  return bundle({
    entryPoint,
    publicDir,
    onProgress: (progress) => {
      consola.info(`Bundle progress: ${progress}%`)
    },
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        plugins: [
          ...(config.resolve?.plugins ?? []),
          new TsconfigPathsPlugin(),
        ],
      },
    }),
  })
}
