import { consola } from "consola"
import { readFile, writeFile, access } from "node:fs/promises"
import { join } from "node:path"

import { clearCache, ensureCacheDir } from "./cache"
import { PATHS } from "./paths"

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
}

interface CacheEntry {
  timestamp: number
  data: string
}

export class CacheManager {
  private cacheFile: string
  private cache = new Map<string, CacheEntry>()

  constructor(
    prefix: string,
    private readonly options: CacheOptions = {},
  ) {
    this.cacheFile = join(PATHS.CACHE_DIR, `${prefix}-cache.json`)
  }

  private async ensureCacheDir(): Promise<string> {
    await ensureCacheDir()
    await this.loadCache()
    return PATHS.CACHE_DIR
  }

  private async loadCache(): Promise<void> {
    try {
      await access(this.cacheFile)
    } catch {
      return
    }

    try {
      const fileContent = await readFile(this.cacheFile, "utf-8")
      const rawData = JSON.parse(fileContent) as Record<string, CacheEntry>

      // Type guard to validate the cache entry structure
      const isValidCacheEntry = (entry: unknown): entry is CacheEntry => {
        return (
          entry !== null &&
          typeof entry === "object" &&
          "timestamp" in entry &&
          typeof (entry as CacheEntry).timestamp === "number" &&
          "data" in entry &&
          typeof (entry as CacheEntry).data === "string"
        )
      }

      // Validate and convert the data
      if (typeof rawData === "object") {
        const entries = Object.entries(rawData).filter(
          (entry): entry is [string, CacheEntry] => isValidCacheEntry(entry[1]),
        )
        this.cache = new Map(entries)
      }
    } catch (error) {
      consola.warn("Failed to load cache:", error)
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const data = Object.fromEntries(this.cache.entries())
      await writeFile(this.cacheFile, JSON.stringify(data), "utf-8")
    } catch (error) {
      consola.warn("Failed to save cache:", error)
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    if (!this.options.ttl) return false
    return Date.now() - entry.timestamp > this.options.ttl
  }

  async get(key: string): Promise<string | null> {
    await this.ensureCacheDir()
    const entry = this.cache.get(key)

    if (!entry || this.isExpired(entry)) {
      consola.debug(`Cache miss for key: ${key}`)
      this.cache.delete(key)
      return null
    }

    consola.debug(`Cache hit for key: ${key}`)
    return entry.data
  }

  async set(key: string, value: string): Promise<void> {
    await this.ensureCacheDir()
    consola.debug(`Setting cache for key: ${key}`)
    this.cache.set(key, {
      timestamp: Date.now(),
      data: value,
    })
    await this.saveCache()
  }

  async cleanup(): Promise<void> {
    consola.info("Cleaning up cache")
    await clearCache()
    this.cache.clear()
  }
}
