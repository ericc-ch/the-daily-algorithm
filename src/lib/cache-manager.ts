import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

import { createTempDir } from "./temp"

interface CacheEntry<T> {
  timestamp: number
  data: T
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
}

export class CacheManager<T> {
  private cacheDir: string | null = null
  private cacheFile: string | null = null
  private cache = new Map<string, CacheEntry<T>>()

  constructor(
    private readonly prefix: string,
    private readonly options: CacheOptions = {},
  ) {}

  private async ensureCacheDir(): Promise<string> {
    if (!this.cacheDir) {
      this.cacheDir = await createTempDir(`${this.prefix}-cache-`)
      this.cacheFile = join(this.cacheDir, "cache.json")
      await this.loadCache()
    }
    return this.cacheDir
  }

  private async loadCache(): Promise<void> {
    if (!this.cacheFile || !existsSync(this.cacheFile)) return

    try {
      const data = JSON.parse(await readFile(this.cacheFile, "utf-8"))
      this.cache = new Map(Object.entries(data))
    } catch (error) {
      console.warn("Failed to load cache:", error)
    }
  }

  private async saveCache(): Promise<void> {
    if (!this.cacheFile) return

    try {
      const data = Object.fromEntries(this.cache.entries())
      await writeFile(this.cacheFile, JSON.stringify(data), "utf-8")
    } catch (error) {
      console.warn("Failed to save cache:", error)
    }
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    if (!this.options.ttl) return false
    return Date.now() - entry.timestamp > this.options.ttl
  }

  async get(key: string): Promise<T | null> {
    await this.ensureCacheDir()
    const entry = this.cache.get(key)

    if (!entry || this.isExpired(entry)) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  async set(key: string, value: T): Promise<void> {
    await this.ensureCacheDir()
    this.cache.set(key, {
      timestamp: Date.now(),
      data: value,
    })
    await this.saveCache()
  }
}
