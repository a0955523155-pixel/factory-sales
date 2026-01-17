import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 1. 提高警告限制到 1600kb (1.6MB)，這樣就不會一直跳警告，但檔案也不會過大
    chunkSizeWarningLimit: 1600,

    // 2. 簡化打包設定 (最穩定的分包方式)
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 只將 node_modules (第三方套件) 獨立拆出來，這是最安全的做法
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})