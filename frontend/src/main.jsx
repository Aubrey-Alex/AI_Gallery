import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// 【新增】导入并执行拦截器配置
import './utils/request.js'; // 只需要导入，其副作用（设置拦截器）就会执行

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)