import axios from 'axios';

// 1. 设置 axios 基础 URL (防止重复设置)
axios.defaults.baseURL = '';

// 2. 设置请求拦截器
axios.interceptors.request.use(
    (config) => {
        // 尝试从本地存储中获取 Token
        const token = localStorage.getItem('jwt_token');

        // 排除登录和注册接口 (它们不能带 token)
        if (token &&
            !config.url.endsWith('/login') &&
            !config.url.endsWith('/register')) {

            // 按照 JWT 规范，在请求头中添加 Authorization: Bearer <token>
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. 设置响应拦截器 (可选，用于处理 401/403 错误，自动登出)
axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // 如果后端返回 401 (未授权) 或 403 (无权限)，强制登出
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.error("认证失败，Token 无效或已过期，强制登出。");

            // 清理本地存储
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('userInfo');

            // 强制跳转到登录页
            // 注意：拦截器中不能直接使用 useNavigate，需要硬跳转
            window.location.href = '/welcome';
        }
        return Promise.reject(error);
    }
);

export default axios;