import { consola } from "consola"

import { downloadVideo } from "./lib/download-video"
import { MIME_TYPES } from "./lib/mime-types"
import { fileManager } from "./modules/script-generator/lib/file-manager"
import { generateScript } from "./modules/script-generator/main"

consola.level = 5

const location = await downloadVideo({
  url: "https://www.youtube.com/shorts/DxlrwbAhM5o",
})

const upload = await fileManager.uploadFile(location, {
  mimeType: MIME_TYPES.VIDEO.MP4,
})

const file = await fileManager.waitForFileProcessing(upload.file)

const script = await generateScript(file)

consola.log(script)

await fileManager.deleteAllFiles()
