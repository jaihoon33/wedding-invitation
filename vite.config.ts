import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import svgr from "vite-plugin-svgr"
import fs from "fs"

import pkg from "./package.json"
import { createHtmlPlugin } from "vite-plugin-html"
import {
  INVITATION_URL,
  SHARE_IMAGE_FILE,
  GROOM_FULLNAME,
  BRIDE_FULLNAME,
  SHARE_DESCRIPTION,
} from "./src/const"

const distFolder = "build"

let base = "/"

try {
  const url = new URL(pkg.homepage)
  base = url.pathname
} catch (e) {
  base = pkg.homepage || "/"
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    createHtmlPlugin({
      inject: {
        data: {
          INVITATION_URL,
          SHARE_IMAGE_FILE,
          GROOM_FULLNAME,
          BRIDE_FULLNAME,
          DESCRIPTION: SHARE_DESCRIPTION,
        },
      },
    }),
    {
      name: "manifest-inject",
      writeBundle() {
        const content = fs.readFileSync("public/manifest.json", "utf-8")
        const processed = content
          .replace(/<%= GROOM_FULLNAME %>/g, GROOM_FULLNAME)
          .replace(/<%= BRIDE_FULLNAME %>/g, BRIDE_FULLNAME)
        fs.writeFileSync(`${distFolder}/manifest.json`, processed)
        fs.mkdirSync(`${distFolder}/admin`, { recursive: true })
        fs.copyFileSync(
          `${distFolder}/index.html`,
          `${distFolder}/admin/index.html`,
        )
      },
    },
  ],
  server: { port: 3000 },
  build: {
    outDir: distFolder,
    // 작은 갤러리 썸네일도 JS에 포함하지 않아 전체보기를 열 때만 내려받습니다.
    assetsInlineLimit: (filePath) =>
      filePath.includes("/thumbs/") ? false : undefined,
  },
  base,
})
