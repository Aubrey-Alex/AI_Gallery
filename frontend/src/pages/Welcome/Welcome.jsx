import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Welcome.css'; // 我们把样式单独放

const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className="welcome-container">
            <div className="glow-effect"></div>

            <nav>
                <div className="logo">AI Gallery.</div>
                <div className="nav-actions">
                    <button className="btn-link" onClick={() => navigate('/login')}>Log in</button>
                    <button className="btn-primary" onClick={() => navigate('/login')}>Sign up</button>
                </div>
            </nav>

            <section className="hero">
                <div className="text-container">
                    <h1 className="hero-title">
                        AI-Powered<br />
                        <span className="text-line-2">Storage <span className="asterisk">*</span></span>
                    </h1>
                    <p className="subtitle">
                        Login to manage your photos with AI auto-classification, semantic search, and secure cloud storage.
                    </p>
                </div>

                {/* 注意：图片路径之后可能要调整，先用网络图代替占位 */}
                <img src="https://images.unsplash.com/photo-1616016625807-6f8d095d3e02?w=600&q=80" className="floating-card card-main" alt="Main" />
                <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&q=60" className="floating-card card-bg-1" alt="Scenery" />
                <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&q=60" className="floating-card card-bg-2" alt="Mountain" />
                <img src="https://images.unsplash.com/photo-1698295982631-419b6e87f16f?w=400&q=50" className="floating-card card-deep-1" alt="Abstract" />
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=50" className="floating-card card-deep-2" alt="Portrait" />
            </section>
        </div>
    );
};

export default Welcome;