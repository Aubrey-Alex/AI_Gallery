import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

// --- 引入和 Welcome 页面一致的本地图片 ---
import girlImg from '../../assets/images/welcome/girl.avif';
import birdImg from '../../assets/images/welcome/bird.avif';
import mountain2Img from '../../assets/images/welcome/mountain2.jpg';
import manImg from '../../assets/images/welcome/man.jpg';
import womanImg from '../../assets/images/welcome/woman.jpg';
import lakeImg from '../../assets/images/welcome/lake.jpg';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // 使用 useEffect 在页面加载时读取 state
    useEffect(() => {
        if (location.state?.mode === 'signup') {
            setIsLogin(false);
        } else {
            setIsLogin(true);
        }
    }, [location.state]);

    // (登录逻辑保持不变)
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
            {/* 1. 背景层 (内容与 Welcome 保持一致，但会被 CSS 模糊) */}
            <div className="background-container">
                <div className="glow-effect"></div>
                {/* 标题内容也保持一致，但会被 CSS 变暗 */}
                <h1 className="hero-title">AI-Powered<br />Storage *</h1>

                {/* 图片 src 替换为本地变量 */}
                <img src={girlImg} className="floating-card card-main" alt="Main" />
                <img src={birdImg} className="floating-card card-bg-1" alt="Bg1" />
                <img src={mountain2Img} className="floating-card card-bg-2" alt="Bg2" />
                <img src={manImg} className="floating-card card-deep-1" alt="Deep1" />
                <img src={womanImg} className="floating-card card-deep-2" alt="Deep2" />
                {/* 补上第6张图 */}
                <img src={lakeImg} className="floating-card card-deep-3" alt="Deep3" />
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
                                        placeholder="Email or Username" // 参考图提示语
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
                                {/* 新增：Forgot password */}
                                <div className="forgot-password">Forgot password?</div>
                            </>
                        ) : (
                            <>
                                <div className="form-group">
                                    <input type="text" className="input-field" placeholder="Username" />
                                </div>
                                <div className="form-group">
                                    <input type="email" className="input-field" placeholder="Email" />
                                </div>
                                <div className="form-group">
                                    <input type="password" className="input-field" placeholder="Password" />
                                </div>
                                <button className="submit-btn">Create Account</button>
                                <div className="terms-text">By joining, you agree to our Terms.</div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;