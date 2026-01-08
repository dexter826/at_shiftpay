import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // Bỏ qua warning eval từ lottie-web
          if (warning.code === 'EVAL') return;
          warn(warning);
        },
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage'],
            'charts-vendor': ['recharts'],
            'icons-vendor': ['lucide-react'],
            'lottie-vendor': ['lottie-react'],
            'styled-vendor': ['styled-components'],
            'framer-motion-vendor': ['framer-motion'],
            'cropper-vendor': ['react-easy-crop'],
            'core-vendor': ['zod', 'zustand']
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      assetsInclude: ['**/*.json']
    }
  };
});
