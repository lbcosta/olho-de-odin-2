// vitest.config.ts
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': resolve('src/shared'),
      '@main': resolve('src/main'),
      '@renderer': resolve('src/renderer'),
    },
  },
  test: {
    // Default environment is Node (Main Process / pure logic).
    environment: 'node',
    // Renderer/component tests run under jsdom.
    environmentMatchGlobs: [['tests/renderer/**', 'jsdom']],
    setupFiles: ['tests/setup.renderer.ts'],
    include: ['tests/**/*.spec.{ts,tsx}'],
    clearMocks: true,
    restoreMocks: true,
  },
})
