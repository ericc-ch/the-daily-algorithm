import { consola } from "consola"

import type { AuthResult } from "./token-storage"

import { getValidAccessToken } from "./auth"
import { loadTokens } from "./token-storage"

export interface RefreshManager {
  start: () => void
  stop: () => void
}

let refreshInterval: Timer | null = null

export function createRefreshManager(
  initialTokens: AuthResult,
): RefreshManager {
  const scheduleNextRefresh = async () => {
    try {
      consola.debug("Automatic token refresh cycle starting")
      const tokens = await loadTokens()
      if (!tokens) {
        consola.warn("No tokens found during automatic refresh")
        return
      }

      await getValidAccessToken()
      consola.success("Automatic token refresh completed successfully")

      // Schedule next refresh for 5 minutes before expiry
      const nextTokens = await loadTokens()
      if (nextTokens) {
        const timeUntilExpiry = nextTokens.expiresAt.getTime() - Date.now()
        const refreshIn = Math.max(0, timeUntilExpiry - 5 * 60 * 1000) // 5 minutes before expiry
        consola.debug(
          `Next automatic refresh scheduled in ${Math.floor(refreshIn / 1000)} seconds`,
        )
      }
    } catch (error) {
      consola.error("Automatic token refresh failed:", error)
    }
  }

  return {
    start: () => {
      if (refreshInterval) {
        consola.debug("Refresh interval already running")
        return
      }

      consola.info("Starting automatic token refresh")
      const timeUntilExpiry = initialTokens.expiresAt.getTime() - Date.now()
      const refreshIn = Math.max(0, timeUntilExpiry - 5 * 60 * 1000)

      refreshInterval = setInterval(scheduleNextRefresh, refreshIn)
      consola.success(
        `Automatic refresh initialized, first refresh in ${Math.floor(
          refreshIn / 1000,
        )} seconds`,
      )
    },
    stop: () => {
      if (refreshInterval) {
        consola.info("Stopping automatic token refresh")
        clearInterval(refreshInterval)
        refreshInterval = null
        consola.success("Automatic token refresh stopped")
      }
    },
  }
}

export function cleanup() {
  if (refreshInterval) {
    consola.info("Cleaning up auth module")
    clearInterval(refreshInterval)
    refreshInterval = null
    consola.success("Auth module cleanup completed")
  }
}
