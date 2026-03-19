import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 1. 確保有引入 HelmetProvider
import { HelmetProvider } from 'react-helmet-async'

ReactDOM.createRoot(document.getElementById('root')).render(
  // 2. 用 HelmetProvider 包住整個 App，並且「不要」加回 StrictMode，這樣 3D 才會順！
  <HelmetProvider>
    <App />
  </HelmetProvider>
)