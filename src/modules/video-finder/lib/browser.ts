import consola from "consola"
import spawn from "nano-spawn"
import playwright from "playwright"
import { isLinux, isMacOS, isWindows } from "std-env"

type BrowserCommand = readonly [string, ReadonlyArray<string>]

const getBrowserCommand = (): BrowserCommand => {
  if (isLinux || isMacOS) return ["which", ["chromium"]] as const
  if (isWindows) return ["where", ["chromium"]] as const

  throw new Error(
    "Unsupported operating system. Cannot determine chromium executable path.",
  )
}

const getChromiumPath = async (): Promise<string | null> => {
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

const createBrowser = async (): Promise<playwright.Browser> => {
  const executablePath = await getChromiumPath()
  return playwright.chromium.launch({
    ...(executablePath && { executablePath }),
    headless: false,
  })
}

interface BrowserContext {
  context: playwright.BrowserContext
  cleanup: () => Promise<void>
}

interface BrowserPage {
  page: playwright.Page
  cleanup: () => Promise<void>
}

interface BrowserState {
  browser: playwright.Browser | undefined
  idleTimer: Timer | undefined
  closePromise: Promise<void> | undefined
}

// Module-level state
let browserState: BrowserState = {
  browser: undefined,
  idleTimer: undefined,
  closePromise: undefined,
}

export const createContext = async (): Promise<BrowserContext> => {
  const browser = await getBrowser()
  const context = await browser.newContext(playwright.devices["Desktop Chrome"])

  return {
    context,
    cleanup: async () => {
      await context.close()
      resetIdleTimeout()
    },
  }
}

export const createPage = async (): Promise<BrowserPage> => {
  const { context, cleanup: contextCleanup } = await createContext()
  const page = await context.newPage()

  return {
    page,
    cleanup: async () => {
      await page.close()
      await contextCleanup()
    },
  }
}

const IDLE_TIMEOUT = 60_000 // 1 minute

export const resetIdleTimeout = () => {
  if (browserState.idleTimer) {
    clearTimeout(browserState.idleTimer)
  }

  browserState.idleTimer = setTimeout(async () => {
    await closeBrowser()
  }, IDLE_TIMEOUT)
}

export const closeBrowser = async (): Promise<void> => {
  if (!browserState.browser) return

  // The following is the same as Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  const { promise, resolve } = Promise.withResolvers<void>()
  browserState.closePromise = promise

  try {
    if (browserState.idleTimer) {
      clearTimeout(browserState.idleTimer)
    }
    await browserState.browser.close()
  } finally {
    browserState = {
      browser: undefined,
      idleTimer: undefined,
      closePromise: undefined,
    }
    resolve()
  }
}

export const getBrowser = async (): Promise<playwright.Browser> => {
  if (browserState.closePromise) {
    await browserState.closePromise
    browserState.closePromise = undefined
  }

  resetIdleTimeout()

  if (!browserState.browser) {
    browserState.browser = await createBrowser()
  }

  return browserState.browser
}
