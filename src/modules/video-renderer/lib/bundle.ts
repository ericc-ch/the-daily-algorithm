import { bundle } from "@remotion/bundler"
import consola from "consola"
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin"

import { CacheManager } from "~/lib/cache-manager"

const BUNDLE_CACHE_TTL = 24 * 60 * 60 * 1000 // 1 day in milliseconds

export interface BundleOptions {
  entryPoint: string
  publicDir: string
}

const bundleCache = new CacheManager("remotion-bundle", {
  ttl: BUNDLE_CACHE_TTL,
})

export async function createCachedBundle(
  options: BundleOptions,
): Promise<string> {
  const cacheKey = options.entryPoint

  const cachedBundle = await bundleCache.get(cacheKey)
  if (cachedBundle) {
    consola.info("Using cached bundle")
    return cachedBundle
  }

  consola.info("Creating new bundle")
  const bundleLocation = await createBundle(options)
  await bundleCache.set(cacheKey, bundleLocation)
  return bundleLocation
}

async function createBundle({ entryPoint, publicDir }: BundleOptions) {
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
