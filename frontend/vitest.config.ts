import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Kept separate from vite.config.ts rather than adding a `test` block there: this project's Vite
// (8.x, rolldown-based) and vitest's own pinned Vite dependency are different major builds whose
// Plugin<T> types don't structurally match, so importing both defineConfig flavors into one file
// makes `tsc -b` fail on the merged config's plugin array. Neither tsconfig here includes this
// file, so that type mismatch (real, but only inside this file) never reaches the app's type
// check — vitest itself loads this config by transpiling it, not by type-checking it.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  }),
)
