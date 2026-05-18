import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    proxy: {
      // Proxy /codepush-api to the real CodePush server to bypass CORS in dev
      '/codepush-api': {
        target: 'https://codepush.landmarkgroup.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/codepush-api/, ''),
        secure: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
