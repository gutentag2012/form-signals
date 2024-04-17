import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vitest/config'
import { libInjectCss } from 'vite-plugin-lib-inject-css'

export default defineConfig({
  test: {
    name: 'dev-tools-react',
    dir: './src',
    watch: false,
    environment: 'jsdom',
    globals: false,
    coverage: {
      enabled: true,
      provider: 'istanbul',
      include: ['src/**/*'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.spec-d.ts'],
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
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
    typecheck: { enabled: true },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    cssCodeSplit: true,
    rollupOptions: {
      external: [
        '@preact/signals-core',
        '@preact/signals-react',
        '@preact/signals-react-transform',
        '@preact/signals-react/runtime',
        '@formsignals/form-react',
        '@radix-ui/react-tooltip',
        'react',
        'react/jsx-runtime',
      ],
      output: {
        preserveModules: false,
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
    react({
      babel: {
        plugins: [
          [
            'module:@preact/signals-react-transform',
            { importSource: '@preact/signals-react/runtime' },
          ],
        ],
      },
    }),
    libInjectCss(),
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
