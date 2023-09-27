import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin, bytecodePlugin } from 'electron-vite'

export default defineConfig({
  publicDir: false,
  main: {
    plugins: [
      externalizeDepsPlugin(),
    ],
  },
  preload: {
    plugins: [
      externalizeDepsPlugin(),
    ],
  },
  renderer: {}
})
