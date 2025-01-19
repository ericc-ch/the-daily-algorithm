import {
  FileState,
  GoogleAIFileManager,
  type FileMetadataResponse,
} from "@google/generative-ai/server"
import { consola } from "consola"

import { ENV } from "~/lib/env"
import { sleep } from "~/lib/sleep"
import {
  createTempDir,
  createTempFile,
  cleanupTempDir,
  cleanupTempFile,
} from "~/lib/temp"

interface UploadOptions {
  mimeType: string
}

export class GoogleFileManager {
  private fileManager: GoogleAIFileManager
  private tempDir: string | null = null

  constructor(apiKey: string) {
    this.fileManager = new GoogleAIFileManager(apiKey)
  }

  private async ensureTempDir(): Promise<string> {
    if (!this.tempDir) {
      this.tempDir = await createTempDir("google-ai-")
    }
    return this.tempDir
  }

  async uploadBlob(blob: Blob, { mimeType }: UploadOptions) {
    const tempDir = await this.ensureTempDir()
    consola.start(`Uploading blob of size: ${(blob.size / 1024).toFixed(2)} KB`)

    const tempFile = await createTempFile(
      await blob.text(),
      tempDir,
      "upload_blob",
    )

    try {
      const response = await this.fileManager.uploadFile(tempFile, {
        mimeType,
      })
      consola.success(`Uploaded blob: ${response.file.name}`)
      return response
    } finally {
      await cleanupTempFile(tempFile)
    }
  }

  async uploadFile(path: string, { mimeType }: UploadOptions) {
    consola.info(`Starting file upload: ${path}`)
    const response = await this.fileManager.uploadFile(path, {
      mimeType,
    })
    consola.success(`Uploaded file: ${response.file.name}`)
    return response
  }

  async deleteAllFiles(): Promise<void> {
    consola.start("Cleaning up uploaded files")

    const fileList = await this.fileManager.listFiles()

    // Google is lying, `fileList` can be an empty object
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const files = fileList.files ?? []
    const totalFiles = files.length

    if (totalFiles === 0) {
      consola.info("No files to delete")
      return
    }

    consola.info(`Found ${totalFiles} file(s) to delete`)
    const results = await Promise.allSettled(
      files.map((file) => this.fileManager.deleteFile(file.name)),
    )

    const succeeded = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length

    if (failed > 0) {
      consola.warn(`Failed to delete ${failed} file(s)`)
    }
    consola.success(`Successfully deleted ${succeeded} file(s)`)
  }

  async waitForFileProcessing(
    file: FileMetadataResponse,
    pollInterval = 1000,
  ): Promise<FileMetadataResponse> {
    consola.start(`Processing file: ${file.name}`)
    let currentFile = file
    let attempts = 0
    const maxAttempts = 30 // 30 seconds with 1s poll interval by default

    while (currentFile.state === FileState.PROCESSING) {
      attempts++
      consola.debug(`Processing attempt ${attempts}/${maxAttempts}...`)

      if (attempts >= maxAttempts) {
        throw new Error(`Timeout waiting for file processing: ${file.name}`)
      }

      await sleep(pollInterval)
      currentFile = await this.fileManager.getFile(file.name)
    }

    if (currentFile.state !== FileState.ACTIVE) {
      throw new Error(
        `File processing failed: ${file.name} (State: ${currentFile.state})`,
      )
    }

    consola.success(`Successfully processed file: ${file.name}`)
    return currentFile
  }

  async cleanup(): Promise<void> {
    if (this.tempDir) {
      await cleanupTempDir(this.tempDir)
      this.tempDir = null
    }
  }
}

// Export a singleton instance
export const fileManager = new GoogleFileManager(ENV.GEMINI_API_KEY)
