import { resolve } from 'node:path'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'form-core',
    dir: './src',
    watch: false,
    environment: 'jsdom',
    globals: false,
    coverage: {
      enabled: true,
      provider: 'istanbul',
      include: ['src/**/*'],
      exclude: ['**/*.spec.ts', '**/*.spec-d.ts', '**/*.bench.ts'],
      reporter: [
        'html',
        'lcov',
        'text',
        'text-summary',
        'json',
        'json-summary',
        'cobertura',
      ],
      reportOnFailure: true,
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
    typecheck: { enabled: true },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: ['@preact/signals-core'],
      output: {
        preserveModules: true,
      },
    },
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: (format, entryName) => {
        const folder = format === 'cjs' ? 'cjs' : 'esm'
        const fileEnding = format === 'cjs' ? 'cjs' : 'js'
        return `${folder}/${entryName}.${fileEnding}`
      },
      formats: ['es', 'cjs'],
    },
  },
  plugins: [
    dts({
      exclude: [
        '**/*.spec.ts',
        '**/*.spec-d.ts',
        '**/*.bench.ts',
        'vite.config.ts',
      ],
      insertTypesEntry: true,
    }),
  ],
})
