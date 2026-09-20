import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — относительные пути, поэтому сборка работает на GitHub Pages
// при любом названии репозитория (https://user.github.io/<repo>/).
export default defineConfig({
  base: './',
  plugins: [react()],
});
