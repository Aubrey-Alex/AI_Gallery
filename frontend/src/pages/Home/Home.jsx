import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({ username: 'Guest' });
    const [viewMode, setViewMode] = useState('grid');

    // 【修改点 1】新增状态：用来精准控制谁被悬停，解决闪烁问题
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const streamWrapperRef = useRef(null);
    const [streamItems, setStreamItems] = useState([]);
    const [isFlowing, setIsFlowing] = useState(false);

    const rawImages = [
        { id: 1, url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80', title: 'AI Tech', tag: '#Cyber' },
        { id: 2, url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80', title: 'Highland', tag: '#Nature' },
        { id: 3, url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80', title: 'Modern', tag: '#Building' },
        { id: 4, url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80', title: 'Portrait', tag: '#Woman' },
        { id: 5, url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', title: 'City Life', tag: '#Urban' },
        { id: 6, url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80', title: 'Cute Dog', tag: '#Pet' },
        { id: 7, url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', title: 'Seaside', tag: '#Ocean' },
        { id: 8, url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80', title: 'Fresh Food', tag: '#Lunch' },
    ];

    // 1. 用户检查
    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (!storedUser) {
            message.warning('请先登录');
            navigate('/welcome');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        message.success('已退出登录');
        navigate('/welcome');
    };

    // 2. 数据准备
    useEffect(() => {
        if (viewMode === 'stream') {
            const loopData = [...rawImages, ...rawImages];
            setStreamItems(loopData);
            setIsFlowing(false);
            setHoveredIndex(null); // 切换模式时重置悬停状态
        } else {
            setStreamItems([]);
        }
    }, [viewMode]);

    // 3. 核心动画逻辑 (保持你原有的逻辑不变)
    useEffect(() => {
        if (viewMode === 'stream' && streamItems.length > 0 && streamWrapperRef.current) {
            const wrapper = streamWrapperRef.current;
            const cards = Array.from(wrapper.children);

            if (cards.length !== streamItems.length) return;

            const totalCards = cards.length;
            const midIndex = Math.floor(totalCards / 2);

            const cardWidth = 260;
            const cardOverlap = 160;
            const screenCenter = wrapper.parentElement.offsetWidth / 2;
            const centerLeft = screenCenter - (cardWidth / 2);

            // --- 阶段一 ---
            cards.forEach((card, index) => {
                card.style.transition = 'none';
                card.style.zIndex = index;
                card.style.left = `${centerLeft}px`;
                card.style.opacity = '0';
                const randomRot = (Math.random() - 0.5) * 15;
                card.style.transform = `translateY(-50%) scale(1.3) rotateZ(${randomRot}deg) translateZ(0)`;
            });

            wrapper.offsetHeight;

            // --- 阶段二 ---
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.1s';
                    card.style.opacity = '1';
                    const randomRot = (Math.random() - 0.5) * 12;
                    card.style.transform = `translateY(-50%) scale(1) rotateZ(${randomRot}deg) translateZ(0)`;
                    card.style.boxShadow = "0 8px 25px rgba(0,0,0,0.5)";
                }, index * 30);
            });

            // --- 阶段三 ---
            const stackDuration = totalCards * 30;
            const spreadStartDelay = stackDuration + 200;

            setTimeout(() => {
                cards.forEach((card, index) => {
                    const dist = Math.abs(index - midIndex);
                    const staggerDelay = dist * 15;

                    setTimeout(() => {
                        card.style.transition = 'all 1.4s cubic-bezier(0.16, 1, 0.3, 1)';
                        const finalLeft = index * cardOverlap;
                        card.style.left = `${finalLeft}px`;
                        card.style.transform = `translateY(-50%) rotateY(30deg) rotateX(5deg) scale(0.9) translateZ(0)`;
                        card.style.boxShadow = "15px 20px 40px rgba(0,0,0,0.6)";
                    }, staggerDelay);
                });
            }, spreadStartDelay);

            // --- 阶段四 ---
            const maxDist = Math.max(midIndex, totalCards - midIndex);
            const totalAnimationTime = spreadStartDelay + (maxDist * 15) + 1300;

            const flowTimer = setTimeout(() => {
                setIsFlowing(true);
            }, totalAnimationTime);

            return () => clearTimeout(flowTimer);
        }
    }, [viewMode, streamItems]);

    return (
        <div className="home-container">
            <aside className="sidebar">
                <div className="logo">
                    <i className="ri-planet-line" style={{ fontSize: '1.6rem' }}></i>
                    <span>AI Gallery</span>
                </div>
                <div className="menu-group">
                    <div className="menu-title">Library</div>
                    <div className="menu-item active"><i className="ri-gallery-view-2"></i><span>All Photos</span></div>
                    <div className="menu-item"><i className="ri-heart-3-line"></i><span>Favorites</span></div>
                </div>
                <div className="menu-group">
                    <div className="menu-title">AI Smart Tags</div>
                    <div className="menu-item"><i className="ri-landscape-line"></i><span>Scenery</span><div className="ai-tag-badge">12</div></div>
                    <div className="menu-item"><i className="ri-user-smile-line"></i><span>Portraits</span><div className="ai-tag-badge">8</div></div>
                </div>
            </aside>

            <main className="main-content">
                <header className="top-bar">
                    <div className="search-container">
                        <input type="text" className="search-input" placeholder="Ask AI: 'Show me seaside photos...'" />
                        <i className="ri-sparkling-2-line search-icon"></i>
                    </div>
                    <div className="top-actions">
                        {/* ... 视图切换按钮保持不变 ... */}

                        <button className="upload-btn"><i className="ri-upload-cloud-2-line"></i>Upload</button>

                        {/* 【修改点 2】删除原来的 img 头像，换成文字问候 */}
                        <div
                            className="user-greeting-wrapper"
                            onClick={handleLogout}
                            title="Click to Logout"
                        >
                            <span className="greeting-text">Hello,</span>
                            <span className="username-text">{user.username || 'Guest'}</span>
                        </div>
                    </div>
                </header>

                <div className={`gallery-viewport mode-${viewMode}`}>
                    {viewMode === 'grid' && (
                        <div className="grid-layout">
                            {rawImages.map((img) => (
                                <div className="card-item" key={img.id}>
                                    <img src={img.url} className="card-img" alt={img.title} loading="lazy" />
                                    <div className="card-overlay">
                                        <div className="card-info">
                                            <h4>{img.title}</h4>
                                            <span className="ai-tag">{img.tag}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {viewMode === 'stream' && (
                        <div
                            ref={streamWrapperRef}
                            className={`stream-wrapper ${isFlowing ? 'is-flowing' : ''}`}
                            style={{ width: `${streamItems.length * 160}px` }}
                        >
                            {/* 【修改点 2】使用 state 控制 className，并绑定事件 */}
                            {streamItems.map((img, index) => (
                                <div
                                    className={`card-item card-in-stream ${hoveredIndex === index ? 'is-active' : ''}`}
                                    key={`${img.id}-${index}`}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                >
                                    <img src={img.url} className="card-img" alt={img.title} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Home;