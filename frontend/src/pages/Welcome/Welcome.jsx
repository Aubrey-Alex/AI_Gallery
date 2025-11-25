import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Welcome.css';
import manImg from '../../assets/images/welcome/man.jpg';
import girlImg from '../../assets/images/welcome/girl.avif';
import mountain2Img from '../../assets/images/welcome/mountain2.jpg';
import birdImg from '../../assets/images/welcome/bird.avif';
import womanImg from '../../assets/images/welcome/woman.jpg';
import lakeImg from '../../assets/images/welcome/lake.jpg';

const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className="welcome-page">
            <div className="glow-effect"></div>

            <nav>
                <div className="logo">AI Gallery.</div>
                <div className="nav-actions">
                    {/* 【修改点1】点击 Log in，传参 mode: 'login' */}
                    <span
                        className="btn-login pointer"
                        onClick={() => navigate('/login', { state: { mode: 'login' } })}
                    >
                        Log in
                    </span>

                    {/* 【修改点2】点击 Sign up，传参 mode: 'signup' */}
                    <span
                        className="btn-signup pointer"
                        onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                    >
                        Sign up
                    </span>
                </div>
            </nav>

            <section className="hero">
                <div className="text-container">
                    <h1 className="hero-title">
                        AI-Powered<br />
                        <span className="text-line-2">
                            Storage <span className="asterisk">*</span>
                        </span>
                    </h1>
                    <p className="subtitle">
                        Login to manage your photos with AI auto-classification, semantic search, and secure cloud storage.
                    </p>
                </div>
                <div className="gallery-scale-wrapper">
                    {/* 图片组 - 严格对应 CSS 中的6张图 */}

                    {/* 1. 主图 */}
                    <img
                        src={girlImg}
                        className="floating-card card-main"
                        alt="Main Portrait"
                    />

                    {/* 2. 右上 */}
                    <img
                        src={birdImg}
                        className="floating-card card-bg-1"
                        alt="Scenery Top"
                    />

                    {/* 3. 左下 */}
                    <img
                        src={mountain2Img}
                        className="floating-card card-bg-2"
                        alt="Scenery Bottom"
                    />

                    {/* 4. 顶部 */}
                    <img
                        src={manImg}
                        className="floating-card card-deep-1"
                        alt="Decoration 1"
                    />

                    {/* 5. 右侧人像 */}
                    <img
                        src={womanImg}
                        className="floating-card card-deep-2"
                        alt="Decoration 2"
                    />

                    {/* 6. 底部风景 */}
                    <img
                        src={lakeImg}
                        className="floating-card card-deep-3"
                        alt="Decoration 3"
                    />
                </div>
            </section>
        </div>
    );
};

export default Welcome;