import { mkdir, readFile, writeFile, rm } from "node:fs/promises"
import { join } from "node:path"

import { PATHS } from "./paths"

/**
 * Creates the cache directory if it doesn't exist
 * @returns Path to the cache directory
 */
export const ensureCacheDir = async (): Promise<string> => {
  await mkdir(PATHS.CACHE_DIR, { recursive: true })
  return PATHS.CACHE_DIR
}

/**
 * Writes data to a cache file
 * @param content - Content to write to the cache file
 * @param filename - Name of the cache file
 * @returns Path to the created cache file
 */
export const writeCacheFile = async (
  content: string,
  filename: string,
): Promise<string> => {
  const cacheDir = await ensureCacheDir()
  const filePath = join(cacheDir, filename)
  await writeFile(filePath, content, "utf-8")
  return filePath
}

/**
 * Reads data from a cache file
 * @param filename - Name of the cache file to read
 * @returns Content of the cache file, or null if the file doesn't exist
 */
export const readCacheFile = async (
  filename: string,
): Promise<string | null> => {
  try {
    const filePath = join(PATHS.CACHE_DIR, filename)
    const content = await readFile(filePath, "utf-8")
    return content
  } catch {
    return null
  }
}

/**
 * Removes a cache file
 * @param filename - Name of the cache file to remove
 * @returns Promise that resolves when deletion is complete
 */
export const deleteCacheFile = async (filename: string): Promise<void> => {
  const filePath = join(PATHS.CACHE_DIR, filename)
  await rm(filePath, { force: true })
}

/**
 * Clears all files from the cache directory
 * @returns Promise that resolves when cleanup is complete
 */
export const clearCache = async (): Promise<void> => {
  await rm(PATHS.CACHE_DIR, { recursive: true, force: true })
  await ensureCacheDir()
}
