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
    consola.start(`Uploading blob: ${blob.size} bytes`)

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
    consola.start(`Uploading file: ${path}`)
    const response = await this.fileManager.uploadFile(path, {
      mimeType,
    })
    consola.success(`Uploaded file: ${response.file.name}`)
    return response
  }

  async deleteAllFiles(): Promise<void> {
    consola.start("Deleting all uploaded files")
    const fileList = await this.fileManager.listFiles()

    const deletePromises = fileList.files.map((file) =>
      this.fileManager.deleteFile(file.name),
    )

    await Promise.allSettled(deletePromises)
    consola.success("Deleted all uploaded files")
  }

  async waitForFileProcessing(
    file: FileMetadataResponse,
    pollInterval = 1000,
  ): Promise<void> {
    consola.start(`Waiting for file processing: ${file.name}`)

    let currentFile = file
    while (currentFile.state === FileState.PROCESSING) {
      await sleep(pollInterval)
      currentFile = await this.fileManager.getFile(file.name)
    }

    if (currentFile.state !== FileState.ACTIVE) {
      throw new Error(`Failed processing file: ${file.name}`)
    }

    consola.success(`File processed: ${file.name}`)
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
