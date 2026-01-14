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
          manualChunks(id) {
            // React core
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor';
            }
            
            // Firebase - tách từng module
            if (id.includes('firebase/app')) return 'firebase-app';
            if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
              return 'firebase-firestore';
            }
            if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
              return 'firebase-auth';
            }
            if (id.includes('firebase/storage') || id.includes('@firebase/storage')) {
              return 'firebase-storage';
            }
            
            // Charts - chỉ import khi cần
            if (id.includes('recharts')) return 'charts-vendor';
            
            // Icons
            if (id.includes('lucide-react')) return 'icons-vendor';
            
            // Animation
            if (id.includes('lottie-react') || id.includes('lottie-web')) {
              return 'lottie-vendor';
            }
            if (id.includes('framer-motion')) return 'framer-motion-vendor';
            
            // Styling
            if (id.includes('styled-components')) return 'styled-vendor';
            
            // Utilities
            if (id.includes('@ncdai/react-wheel-picker')) return 'picker-vendor';
            if (id.includes('react-easy-crop')) return 'cropper-vendor';
            
            // Core utils
            if (id.includes('zod') || id.includes('zustand') || 
                id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'core-vendor';
            }
          }
        }
      },
      chunkSizeWarningLimit: 600,
      assetsInclude: ['**/*.json']
    }
  };
});
