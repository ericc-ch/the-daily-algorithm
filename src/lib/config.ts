import os from "node:os"

export interface Config {
  concurrency: number
}

let globalConfig: Config = {
  concurrency: os.cpus().length,
}

export function setConfig(config: Partial<Config>) {
  globalConfig = { ...globalConfig, ...config }
}

export function getConfig(): Config {
  return globalConfig
}
