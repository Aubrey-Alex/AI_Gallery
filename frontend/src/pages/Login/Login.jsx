// src/pages/Home/Login.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

// 引入本地图片
import girlImg from '../../assets/images/welcome/girl.avif';
import birdImg from '../../assets/images/welcome/bird.avif';
import mountain2Img from '../../assets/images/welcome/mountain2.jpg';
import manImg from '../../assets/images/welcome/man.jpg';
import womanImg from '../../assets/images/welcome/woman.jpg';
import lakeImg from '../../assets/images/welcome/lake.jpg';

// 配置 axios 基础 URL
axios.defaults.baseURL = 'http://localhost:8080';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 状态管理
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');

    // --- 【新增】Refs 用于控制光标跳转 ---
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

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

            if (res.data.token) {
                message.success('登录成功！欢迎回来');

                localStorage.setItem('jwt_token', res.data.token);
                localStorage.setItem('userInfo', JSON.stringify({
                    username: res.data.username,
                    userId: res.data.userId
                }));

                setPassword('');
                navigate('/');
            } else {
                message.error(res.data.msg || '登录失败，请检查用户名和密码');
            }
        } catch (error) {
            console.error("登录错误对象:", error);

            let errorMessage = '登录连接失败或后端服务未启动';

            if (error.response) {
                console.error("HTTP Status:", error.response.status);
                if (error.response.status === 404) {
                    errorMessage = '接口地址错误 (404)';
                } else if (error.response.status === 500) {
                    errorMessage = '服务器内部错误 (500)';
                } else if (error.response.data && error.response.data.msg) {
                    errorMessage = error.response.data.msg;
                }
            }

            message.error(errorMessage);
        }
    };

    // --- 注册逻辑 ---
    const handleRegister = async () => {
        if (!username || !password || !email) {
            message.warning('请填写完整信息');
            return;
        }
        if (username.length <= 6) {
            message.warning('用户名长度必须大于6位');
            return;
        }
        if (password.length <= 6) {
            message.warning('密码长度必须大于6位');
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            message.warning('请输入有效的邮箱地址');
            return;
        }

        try {
            const res = await axios.post('/api/user/register', {
                username,
                password,
                email
            });

            if (res.data === "注册成功" || res.data === true) {
                message.success('注册成功！请直接登录');

                setUsername('');
                setPassword('');
                setEmail('');

                setIsLogin(true);
            } else {
                message.error(res.data);
            }
        } catch (error) {
            console.error(error);
            message.error('注册连接失败，请检查网络');
        }
    };

    // --- 【新增】统一表单提交处理 ---
    const handleFormSubmit = (e) => {
        e.preventDefault(); // 阻止浏览器默认刷新
        if (isLogin) {
            handleLogin();
        } else {
            handleRegister();
        }
    };

    // --- 【新增】回车跳转处理函数 ---
    const handleEnterKey = (e, nextRef) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // 阻止默认提交
            nextRef.current?.focus(); // 跳转到下一个输入框
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
                        <button
                            type="button"
                            className={`tab-btn ${isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(true)}
                        >
                            Log in
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${!isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(false)}
                        >
                            Sign up
                        </button>
                    </div>

                    <div className="form-view">
                        <form onSubmit={handleFormSubmit}>
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
                                            autoFocus
                                            // 登录模式：回车跳到密码框
                                            onKeyDown={(e) => handleEnterKey(e, passwordRef)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            ref={passwordRef} // 绑定 Ref
                                            type="password"
                                            className="input-field"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        // 最后一个输入框不加 onKeyDown，默认回车提交表单
                                        />
                                    </div>
                                    <button type="submit" className="submit-btn">Log In</button>
                                    <div
                                        className="forgot-password"
                                        onClick={() => message.info('请联系管理员重置密码')}
                                    >
                                        Forgot password?
                                    </div>
                                </>
                            ) : (
                                // --- 注册表单 ---
                                <>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Create Username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            autoFocus
                                            // 注册模式：回车跳到邮箱框
                                            onKeyDown={(e) => handleEnterKey(e, emailRef)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            ref={emailRef} // 绑定 Ref
                                            type="email"
                                            className="input-field"
                                            placeholder="Email Address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            // 注册模式：回车跳到密码框
                                            onKeyDown={(e) => handleEnterKey(e, passwordRef)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            ref={passwordRef} // 绑定 Ref
                                            type="password"
                                            className="input-field"
                                            placeholder="Create Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        // 最后一个输入框不加 onKeyDown，默认回车提交表单
                                        />
                                    </div>
                                    <button type="submit" className="submit-btn">Create Account</button>
                                    <div className="terms-text">By joining, you agree to our Terms.</div>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;