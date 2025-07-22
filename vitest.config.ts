import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      obsidian: './src/test/obsidian-mock.ts'
    }
  }
});
