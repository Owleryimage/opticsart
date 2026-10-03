import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `__dirname` 在 ESM 配置里不存在（package.json 是 "type": "module"），用 URL 换算。
// base 使用相对路径：同一份产物既能放在根域，也能放在 GitHub Pages 的 /<repo>/ 子路径下。
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
