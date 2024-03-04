import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

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
      reporter: ['html', 'lcov', 'text', 'text-summary'],
    },
    typecheck: { enabled: true },
  },
  build: {
    outDir: 'dist',
    exclude: ['**/*.spec.ts', '**/*.spec-d.ts'],
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
      exclude: ['**/*.spec.ts', '**/*.spec-d.ts'],
      insertTypesEntry: true,
    }),
  ],
})
