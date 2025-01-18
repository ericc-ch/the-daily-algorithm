import { consola } from "consola"
import { Buffer } from "node:buffer"
import { writeFile } from "node:fs/promises"
import { join } from "pathe"

import { downloadVideo } from "./lib/download-video"
import { MIME_TYPES } from "./lib/mime-types"
import { ensureDirectories, PATHS } from "./lib/paths"
import { generateAudio } from "./modules/audio-generator/main"
import { fileManager } from "./modules/script-generator/lib/file-manager"
import { generateScript } from "./modules/script-generator/main"

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

// Write audio and subtitle files to Remotion public directory
const audioBuffer = Buffer.from(await audio.arrayBuffer())
await writeFile(join(PATHS.REMOTION_PUBLIC_DIR, "audio.mp3"), audioBuffer)
await writeFile(
  join(PATHS.REMOTION_PUBLIC_DIR, "subtitles.json"),
  JSON.stringify(subtitle, null, 2),
)

await fileManager.deleteAllFiles()
