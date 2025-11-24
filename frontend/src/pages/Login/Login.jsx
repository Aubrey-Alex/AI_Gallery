import React, { useState } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // 确保这一行有，引入刚才写的CSS

const Login = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!username || !password) {
            message.warning('请输入用户名和密码');
            return;
        }
        try {
            const res = await axios.post('http://localhost:8080/api/user/login', {
                username, password
            });
            if (res.data === "登录成功") {
                message.success('登录成功！');
                setTimeout(() => navigate('/'), 1000);
            } else {
                message.error(res.data);
            }
        } catch (error) {
            message.error('连接服务器失败');
        }
    };

    return (
        <div className="login-container">
            {/* 1. 背景层 */}
            <div className="background-blur">
                {/* 这里用一张网络图做背景，你也可以换成本地图片 */}
                <img
                    src="https://images.unsplash.com/photo-1616016625807-6f8d095d3e02?w=1920&q=80"
                    className="bg-img"
                    alt="Background"
                />
            </div>

            {/* 2. 居中遮罩层 */}
            <div className="login-overlay">
                <div className="login-card">
                    <div className="modal-logo">AI Gallery.</div>

                    {/* Tab 切换 */}
                    <div className="auth-tabs">
                        <button
                            className={`tab-btn ${isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(true)}
                        >
                            Log in
                        </button>
                        <button
                            className={`tab-btn ${!isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(false)}
                        >
                            Sign up
                        </button>
                    </div>

                    {/* 表单区域 */}
                    <div className="form-view">
                        {isLogin ? (
                            <>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="password"
                                        className="input-field"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <button className="submit-btn" onClick={handleLogin}>Log In</button>
                            </>
                        ) : (
                            <>
                                <div className="form-group">
                                    <input type="text" className="input-field" placeholder="New Username" />
                                </div>
                                <div className="form-group">
                                    <input type="email" className="input-field" placeholder="Email Address" />
                                </div>
                                <div className="form-group">
                                    <input type="password" className="input-field" placeholder="Create Password" />
                                </div>
                                <button className="submit-btn">Create Account</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;