import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['src/tests/setup.ts'],
    css: { include: [/\/impressao\/.+\.css/] },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/models/**', 'src/services/**'],
    },
  },
})
