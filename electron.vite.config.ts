// electron.vite.config.ts
import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const sharedAlias = {
  '@shared': resolve('src/shared'),
  '@main': resolve('src/main'),
  '@renderer': resolve('src/renderer'),
}

export default defineConfig({
  main: {
    // `externalizeDepsPlugin` keeps native deps (better-sqlite3) out of the bundle
    // so their `.node` binaries are loaded at runtime instead of being bundled.
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: sharedAlias },
    build: {
      rollupOptions: {
        input: { index: resolve('src/main/index.ts') },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: sharedAlias },
    build: {
      rollupOptions: {
        input: { index: resolve('src/preload/index.ts') },
      },
    },
  },
  renderer: {
    root: 'src/renderer',
    resolve: { alias: sharedAlias },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: { index: resolve('src/renderer/index.html') },
      },
    },
  },
})
