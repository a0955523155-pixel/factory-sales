import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 1. 調整區塊大小警告限制 (單位: kB)，這裡設為 1000kB (1MB) 或 1500kB
    chunkSizeWarningLimit: 1500,

    // 2. 優化打包設定 (Rollup Options)
    rollupOptions: {
      output: {
        // 手動分包：將第三方套件拆開，避免單一檔案過大
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 將 React 相關套件拆分
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            // 將 Firebase 拆分 (因为它通常很大)
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            // 將 UI 動畫庫拆分
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            // 其他所有 node_modules 內的套件打包成 vendor
            return 'vendor';
          }
        },
      },
    },
  },
})