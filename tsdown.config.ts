import { defineConfig } from 'vite-plus/pack'

export default defineConfig({
  clean: true,
  deps: {
    alwaysBundle: ['@webfill/async-context'],
  },
  dts: true,
  entry: {
    index: 'src/index.ts',
    production: 'src/production.js',
  },
  format: ['esm', 'cjs'],
  platform: 'neutral',
  sourcemap: true,
})
