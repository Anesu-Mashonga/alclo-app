import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Every .scss file gets the design tokens and mixins without an explicit @use.
        additionalData: `@use "@/styles/abstracts" as *;\n`,
      },
    },
  },
  // OPENWEATHER_ keeps the existing .env working without renaming the key.
  envPrefix: ['VITE_', 'OPENWEATHER_'],
  server: {
    port: 5173,
  },
  build: {
    rolldownOptions: {
      output: {
        // Long-lived framework code gets its own cacheable chunk. Only packages the shell
        // loads eagerly anyway are grouped, so lazy page chunks are not pulled forward.
        codeSplitting: {
          groups: [
            {
              name: 'framework',
              test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/,
              priority: 2,
            },
            {
              name: 'data-layer',
              test: /node_modules[\\/](@tanstack|dayjs)[\\/]/,
              priority: 1,
            },
          ],
        },
      },
    },
  },
});
