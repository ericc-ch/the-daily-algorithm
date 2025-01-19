import playwright from "playwright"
import { chromium } from "playwright-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"

import { getChromiumPath } from "../../../lib/browser.js"

const createBrowser = async (): Promise<playwright.Browser> => {
  const executablePath = await getChromiumPath()

  chromium.use(StealthPlugin())

  // https://github.com/berstend/puppeteer-extra/tree/master/packages/playwright-extra#-puppeteer-extra-plugin-stealth
  chromium.plugins.setDependencyDefaults("stealth/evasions/webgl.vendor", {
    vendor: "Bob",
    renderer: "Alice",
  })

  return playwright.chromium.launch({
    ...(executablePath && { executablePath }),
    headless: true,
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
