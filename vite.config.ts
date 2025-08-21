import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  // Use a different base path for 'serve' (local dev) and 'build' (production)
  return {
    base: command === 'build' ? '/Tetris/' : '/',
  };
});
