import { consola } from "consola"

import type { AuthResult } from "./token-storage"

import { refreshAccessToken, initializeAuth } from "./google-oauth"
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

      if (!tokens.refreshToken) {
        consola.warn(
          "No refresh token available, cannot perform automatic refresh",
        )
        return
      }

      const authState = initializeAuth()
      consola.debug("Refreshing access token...")
      const refreshed = await refreshAccessToken(authState, tokens.refreshToken)
      consola.success("Automatic token refresh completed successfully")

      // Schedule next refresh for 5 minutes before expiry
      const timeUntilExpiry = refreshed.expiresAt.getTime() - Date.now()
      const refreshIn = Math.max(0, timeUntilExpiry - 5 * 60 * 1000) // 5 minutes before expiry

      // Reset the interval with the new timing
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
      refreshInterval = setInterval(scheduleNextRefresh, refreshIn)

      consola.debug(
        `Next automatic refresh scheduled in ${Math.floor(refreshIn / 1000)} seconds`,
      )
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

      if (!initialTokens.refreshToken) {
        consola.warn(
          "No refresh token available, cannot start automatic refresh",
        )
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

export function cleanup(): void {
  if (refreshInterval) {
    consola.info("Cleaning up auth module")
    clearInterval(refreshInterval)
    refreshInterval = null
    consola.success("Auth module cleanup completed")
  }
}
