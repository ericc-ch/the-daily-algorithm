import { consola } from "consola"

import { downloadVideo } from "./lib/download-video"

consola.level = 5

// const location = await downloadVideo({
//   url: "https://www.youtube.com/shorts/DxlrwbAhM5o",
// })

// const upload = await fileManager.uploadFile(location, {
//   mimeType: MIME_TYPES.VIDEO.MP4,
// })

// await fileManager.waitForFileProcessing(upload.file)

const videos = [
  "https://www.youtube.com/shorts/sFPC1aecKPo",
  "https://www.youtube.com/shorts/UywQ-Fq25O8",
  "https://www.youtube.com/shorts/Xd70zIcbt4M",
  "https://www.youtube.com/shorts/HExAMgwiisI",
  "https://www.youtube.com/shorts/i5g0idCaR24",
]

for (const video of videos) {
  await downloadVideo({ url: video })
}
