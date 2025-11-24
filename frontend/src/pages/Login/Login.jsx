import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

// 引入本地图片 (保持不变)
import girlImg from '../../assets/images/welcome/girl.avif';
import birdImg from '../../assets/images/welcome/bird.avif';
import mountain2Img from '../../assets/images/welcome/mountain2.jpg';
import manImg from '../../assets/images/welcome/man.jpg';
import womanImg from '../../assets/images/welcome/woman.jpg';
import lakeImg from '../../assets/images/welcome/lake.jpg';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 状态管理
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState(''); // 【新增】邮箱状态

    // 读取路由参数切换 Tab
    useEffect(() => {
        if (location.state?.mode === 'signup') {
            setIsLogin(false);
        } else {
            setIsLogin(true);
        }
    }, [location.state]);

    // --- 登录逻辑 ---
    const handleLogin = async () => {
        if (!username || !password) {
            message.warning('请输入用户名和密码');
            return;
        }
        try {
            const res = await axios.post('/api/user/login', {
                username, password
            });
            if (res.data === "登录成功") {
                message.success('登录成功！欢迎回来');
                setTimeout(() => navigate('/'), 1000); // 跳转到主页
            } else {
                message.error(res.data);
            }
        } catch (error) {
            console.error(error);
            message.error('登录连接失败');
        }
    };

    // --- 【新增】注册逻辑 ---
    const handleRegister = async () => {
        // 1. 简单校验
        if (!username || !password || !email) {
            message.warning('请填写完整信息');
            return;
        }

        try {
            // 2. 发送注册请求
            const res = await axios.post('/api/user/register', {
                username,
                password,
                email
            });

            // 3. 处理结果
            if (res.data === "注册成功" || res.data === true) {
                message.success('注册成功！请直接登录');
                setIsLogin(true); // 注册好了自动切回登录页
            } else {
                message.error('注册失败，用户名或邮箱已被注册');
            }
        } catch (error) {
            console.error(error);
            message.error('注册连接失败');
        }
    };

    return (
        <div className="login-container">
            <div className="background-container">
                <div className="glow-effect"></div>
                <h1 className="hero-title">AI-Powered<br />Storage *</h1>
                <img src={girlImg} className="floating-card card-main" alt="Main" />
                <img src={birdImg} className="floating-card card-bg-1" alt="Bg1" />
                <img src={mountain2Img} className="floating-card card-bg-2" alt="Bg2" />
                <img src={manImg} className="floating-card card-deep-1" alt="Deep1" />
                <img src={womanImg} className="floating-card card-deep-2" alt="Deep2" />
                <img src={lakeImg} className="floating-card card-deep-3" alt="Deep3" />
            </div>

            <div className="login-overlay">
                <div className="login-card">
                    <div className="modal-logo">AI Gallery.</div>

                    <div className="auth-tabs">
                        <button className={`tab-btn ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Log in</button>
                        <button className={`tab-btn ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Sign up</button>
                    </div>

                    <div className="form-view">
                        {isLogin ? (
                            // --- 登录表单 ---
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
                                <div className="forgot-password">Forgot password?</div>
                            </>
                        ) : (
                            // --- 【修改】注册表单 (绑定了 value 和 onChange) ---
                            <>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Create Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="email"
                                        className="input-field"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="password"
                                        className="input-field"
                                        placeholder="Create Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                {/* 绑定 handleRegister */}
                                <button className="submit-btn" onClick={handleRegister}>Create Account</button>
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