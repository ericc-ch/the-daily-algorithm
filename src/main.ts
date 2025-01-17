import { consola } from "consola"

import { downloadVideo } from "./lib/download-video"

consola.level = 5

await downloadVideo({
  url: "https://www.youtube.com/shorts/DxlrwbAhM5o",
})
