import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 提高警告上限，避免 build 時一直跳黃色警告
    chunkSizeWarningLimit: 1600,
    
    // 確保打包後的路徑是相對路徑 (避免部署到子目錄時找不到檔案)
    base: './', 

    rollupOptions: {
      output: {
        // 簡單的分包設定，將第三方套件獨立打包
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})