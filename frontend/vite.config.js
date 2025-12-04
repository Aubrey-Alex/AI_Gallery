import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 5173, // 前端运行端口，默认是5173
        allowedHosts: true,
        proxy: {
            // 代理配置：这里的 '/api' 代表如果请求路径以 /api 开头
            '/api': {
                target: 'http://localhost:8080', // 转发给后端的地址
                changeOrigin: true,
                secure: false,
                // 如果你的后端接口本身就是 /api/user/login，就不需要 rewrite
                // 如果你的后端接口是 /user/login (没有api前缀)，则需要取消下面这行的注释
                // rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    }
})