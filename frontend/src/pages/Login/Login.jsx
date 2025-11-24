import React, { useState } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import './Login.css';

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
            {/* 1. 背景层 (模糊处理) */}
            <div className="background-container">
                <div className="glow-effect"></div>
                <h1 className="hero-title">AI-Powered<br />Storage *</h1>
                <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80" className="floating-card card-main" alt="Main" />
                <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&q=60" className="floating-card card-bg-1" alt="Bg1" />
                <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&q=60" className="floating-card card-bg-2" alt="Bg2" />
                <img src="https://images.unsplash.com/photo-1516826957135-700dedea698c?w=400&q=50" className="floating-card card-deep-1" alt="Deep1" />
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=50" className="floating-card card-deep-2" alt="Deep2" />
            </div>

            {/* 2. 登录框 (居中悬浮) */}
            <div className="login-overlay">
                <div className="login-card">
                    <div className="modal-logo">AI Gallery.</div>

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

                    <div className="form-view">
                        {isLogin ? (
                            <>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Username or Email"
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
                                    <input type="text" className="input-field" placeholder="Create Username" />
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