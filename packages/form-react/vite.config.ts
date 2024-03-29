import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'form-react',
    dir: './src',
    watch: false,
    environment: 'jsdom',
    globals: false,
    coverage: {
      enabled: true,
      provider: 'istanbul',
      include: ['src/**/*'],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.spec-d.ts',
        'src/TestComponent.tsx',
        'src/utils/useIsomorphicLayoutEffect.ts',
      ],
      reporter: ['html', 'lcov', 'text', 'text-summary'],
    },
    typecheck: { enabled: true },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: [
        '@preact/signals-core',
        '@preact/signals-react',
        '@form-signals/form-core',
        'react',
        'react/jsx-runtime',
      ],
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
    react({
      babel: {
        plugins: [['module:@preact/signals-react-transform']],
      },
    }),
    dts({
      exclude: [
        '**/*.spec.ts',
        '**/*.spec-d.ts',
        'vite.config.ts',
        'src/TestComponent.tsx',
      ],
      insertTypesEntry: true,
    }),
  ],
})
