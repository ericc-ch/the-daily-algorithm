/**
 * Creates a promise that resolves after a specified delay
 * @param ms The delay duration in milliseconds
 * @returns A promise that resolves after the specified delay
 * @example
 * await sleep(1000) // waits for 1 second
 */
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))
