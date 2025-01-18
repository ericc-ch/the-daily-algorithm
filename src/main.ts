import { consola } from "consola"
import { Buffer } from "node:buffer"
import { copyFile, writeFile } from "node:fs/promises"

import { downloadVideo } from "./lib/download-video"
import { MIME_TYPES } from "./lib/mime-types"
import { ensureDirectories, PATHS } from "./lib/paths"
import { generateAudio } from "./modules/audio-generator/main"
import { fileManager } from "./modules/script-generator/lib/file-manager"
import { generateScript } from "./modules/script-generator/main"
import { renderVideo } from "./modules/video-renderer/main"

consola.level = 5

await ensureDirectories()

const location = await downloadVideo({
  url: "https://www.youtube.com/shorts/DxlrwbAhM5o",
})

const upload = await fileManager.uploadFile(location, {
  mimeType: MIME_TYPES.VIDEO.MP4,
})
const file = await fileManager.waitForFileProcessing(upload.file)
const script = await generateScript(file)

const { audio, subtitle } = await generateAudio(script)
const audioBuffer = Buffer.from(await audio.arrayBuffer())

await copyFile(location, PATHS.VIDEO_PATH)
await writeFile(PATHS.AUDIO_PATH, audioBuffer)
await writeFile(PATHS.SUBTITLE_PATH, JSON.stringify(subtitle))

const result = await renderVideo()

await writeFile(PATHS.OUTPUT_PATH, result.buffer)

await fileManager.deleteAllFiles()
