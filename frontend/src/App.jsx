import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome/Welcome';
import Login from './pages/Login/Login';
import Home from './pages/Home/Home'; // 引入新页面

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 默认路径改为 Home (内部会检查是否已登录) */}
                <Route path="/" element={<Home />} />

                {/* 欢迎页独立 */}
                <Route path="/welcome" element={<Welcome />} />

                {/* 登录页 */}
                <Route path="/login" element={<Login />} />

                {/* 任何未定义路径都跳回欢迎页 */}
                <Route path="*" element={<Navigate to="/welcome" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;