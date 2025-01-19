import consola from "consola"
import spawn from "nano-spawn"
import { isLinux, isMacOS, isWindows } from "std-env"

type BrowserCommand = readonly [string, ReadonlyArray<string>]

const getBrowserCommand = (): BrowserCommand => {
  if (isLinux || isMacOS) return ["which", ["chromium"]] as const
  if (isWindows) return ["where", ["chromium"]] as const

  throw new Error(
    "Unsupported operating system. Cannot determine chromium executable path.",
  )
}

export const getChromiumPath = async (): Promise<string | null> => {
  const command = getBrowserCommand()
  try {
    const { stdout } = await spawn(...command)
    const path = stdout.trim()
    return path || null
  } catch (_error) {
    consola.warn("Local Chromium not found, falling back to bundled browser")
    return null
  }
}
