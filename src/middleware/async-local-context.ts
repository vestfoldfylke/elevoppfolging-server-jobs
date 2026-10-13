import { AsyncLocalStorage } from "node:async_hooks"
import { type LogConfig, logger } from "@vestfoldfylke/loglady"

const asyncLocalStorage = new AsyncLocalStorage<LogConfig>()

export async function runInContext<T>(logConfig: LogConfig, callback: () => Promise<T>): Promise<T> {
  logger.setContextProvider((): LogConfig | undefined => asyncLocalStorage.getStore())
  return asyncLocalStorage.run(logConfig, callback)
}
