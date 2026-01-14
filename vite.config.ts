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
      target: 'es2015',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
          passes: 2
        },
        mangle: {
          safari10: true
        }
      },
      cssMinify: true,
      reportCompressedSize: false,
      rollupOptions: {
        onwarn(warning, warn) {
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
            'picker-vendor': ['@ncdai/react-wheel-picker'],
            'framer-motion-vendor': ['framer-motion'],
            'cropper-vendor': ['react-easy-crop'],
            'core-vendor': ['zod', 'zustand', 'clsx', 'tailwind-merge']
          }
        }
      },
      chunkSizeWarningLimit: 600,
      assetsInclude: ['**/*.json']
    }
  };
});
