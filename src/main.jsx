import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// ★★★ 1. 引入這行
import { HelmetProvider } from 'react-helmet-async'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ★★★ 2. 用這個包住 <App /> */}
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)