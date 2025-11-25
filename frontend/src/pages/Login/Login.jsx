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

// 【新增】配置 axios 基础 URL，假设后端运行在 8080 端口
// 确保这个全局配置还在，以便于设置拦截器
axios.defaults.baseURL = 'http://localhost:8080';

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
            // 后端返回 JSON 结构：{ token: "...", username: "...", userId: 123 }
            const res = await axios.post('/api/user/login', {
                username, password
            });

            // 检查后端返回的 JSON 数据中是否包含 Token
            if (res.data.token) {
                // ===================================
                // 登录成功逻辑
                // ===================================
                message.success('登录成功！欢迎回来');

                // 存储 JWT Token 和完整用户信息
                localStorage.setItem('jwt_token', res.data.token);
                localStorage.setItem('userInfo', JSON.stringify({
                    username: res.data.username,
                    userId: res.data.userId
                }));

                // 清空密码输入，立即跳转到主页
                setPassword('');
                navigate('/');
            } else {
                // ===================================
                // 登录失败逻辑（检查 JSON 中的 msg 字段）
                // ===================================
                // 后端返回的 JSON 可能是 { msg: "密码错误" }
                message.error(res.data.msg || '登录失败，请检查用户名和密码');
            }
        } catch (error) {
            console.error("登录错误对象:", error); // 打印整个错误对象

            let errorMessage = '登录连接失败或后端服务未启动';

            if (error.response) {
                // 如果收到了响应（非网络连接错误）
                console.error("HTTP Status:", error.response.status);

                if (error.response.status === 404) {
                    errorMessage = '接口地址错误 (404)';
                } else if (error.response.status === 500) {
                    errorMessage = '服务器内部错误 (500)';
                } else if (error.response.data && error.response.data.msg) {
                    // 尝试显示后端返回的错误信息（如果是非 200 状态码返回的结构化错误）
                    errorMessage = error.response.data.msg;
                }
            }

            message.error(errorMessage);
        }
    };

    // --- 【修改】包含完整验证的注册逻辑 ---
    const handleRegister = async () => {
        // --- 1. 前端校验开始 ---

        // 1.1 非空校验
        if (!username || !password || !email) {
            message.warning('请填写完整信息');
            return;
        }

        // 1.2 【新增】长度校验 (要求 > 6)
        if (username.length <= 6) {
            message.warning('用户名长度必须大于6位');
            return;
        }
        if (password.length <= 6) {
            message.warning('密码长度必须大于6位');
            return;
        }

        // 1.3 【新增】邮箱格式校验 (正则)
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            message.warning('请输入有效的邮箱地址');
            return;
        }

        // --- 校验通过，准备发送请求 ---

        try {
            // 2. 发送注册请求
            const res = await axios.post('/api/user/register', {
                username,
                password,
                email
            });

            // 3. 处理后端返回的结果
            if (res.data === "注册成功" || res.data === true) {
                message.success('注册成功！请直接登录');

                // 【关键修改】清空状态，准备登录
                setUsername('');
                setPassword('');
                setEmail('');

                setIsLogin(true); // 自动切回登录页
            } else {
                // 这里会显示后端返回的具体错误信息，比如 "注册失败：用户名或邮箱已被占用"
                message.error(res.data);
            }
        } catch (error) {
            console.error(error);
            message.error('注册连接失败，请检查网络');
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
                                <div
                                    className="forgot-password"
                                    onClick={() => message.info('请联系管理员重置密码')}
                                >
                                    Forgot password?
                                </div>
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