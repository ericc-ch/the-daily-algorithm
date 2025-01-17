import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "pathe"

/**
 * Creates a temporary directory with a unique name in the OS temp directory
 * @param prefix - Optional prefix for the temp directory name
 * @returns Path to the created temporary directory
 */
export const createTempDir = async (prefix = "tmp-"): Promise<string> => {
  const tmpDir = await mkdtemp(join(tmpdir(), prefix))
  return tmpDir
}

/**
 * Creates a temporary file with the given content in the specified directory
 * @param content - Content to write to the temporary file
 * @param dir - Directory to create the file in
 * @param filename - Name of the temporary file
 * @returns Path to the created temporary file
 */
export const createTempFile = async (
  content: string,
  dir: string,
  filename: string,
): Promise<string> => {
  const filePath = join(dir, filename)
  await writeFile(filePath, content, "utf-8")
  return filePath
}

/**
 * Removes a temporary file
 * @param filePath - Path to the temporary file to remove
 * @returns Promise that resolves when deletion is complete
 */
export const cleanupTempFile = async (filePath: string): Promise<void> => {
  await rm(filePath, { force: true })
}

/**
 * Removes a temporary directory and all its contents
 * @param dir - Path to the temporary directory to remove
 * @returns Promise that resolves when cleanup is complete
 */
export const cleanupTempDir = async (dir: string): Promise<void> => {
  await rm(dir, { recursive: true, force: true })
}
