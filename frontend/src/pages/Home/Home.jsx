import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import axios from 'axios'; // 引入 axios
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({ username: 'Guest' });
    const [viewMode, setViewMode] = useState('grid');

    // 【新增】文件选择器的引用
    const fileInputRef = useRef(null);

    // 【修改点 1】新增状态：用来精准控制谁被悬停，解决闪烁问题
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const streamWrapperRef = useRef(null);
    const [streamItems, setStreamItems] = useState([]);
    const [isFlowing, setIsFlowing] = useState(false);

    // const rawImages = [
    //     { id: 1, url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80', title: 'AI Tech', tag: '#Cyber' },
    //     { id: 2, url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80', title: 'Highland', tag: '#Nature' },
    //     { id: 3, url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80', title: 'Modern', tag: '#Building' },
    //     { id: 4, url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80', title: 'Portrait', tag: '#Woman' },
    //     { id: 5, url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', title: 'City Life', tag: '#Urban' },
    //     { id: 6, url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80', title: 'Cute Dog', tag: '#Pet' },
    //     { id: 7, url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', title: 'Seaside', tag: '#Ocean' },
    //     { id: 8, url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80', title: 'Fresh Food', tag: '#Lunch' },
    // ];

    // 【修改 1】把原来的假数据 rawImages 删掉或注释掉，换成 state
    const [images, setImages] = useState([]);

    // 【新增】从后端获取图片列表
    const fetchImages = async () => {
        try {
            const res = await axios.get('/api/image/list');
            if (res.data.code === 200) {
                // 后端返回的是列表数组
                setImages(res.data.data);
            }
        } catch (error) {
            console.error("获取图片列表失败:", error);
        }
    };

    // 1. 用户检查
    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (!storedUser) {
            message.warning('请先登录');
            navigate('/welcome');
        } else {
            setUser(JSON.parse(storedUser));
            // 【修改 2】登录确认后，立即获取图片数据
            fetchImages();
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('jwt_token'); // 记得清理 token
        message.success('已退出登录');
        navigate('/welcome');
    };

    // 2. 数据准备 (修改：使用真实的 images 数据)
    useEffect(() => {
        if (viewMode === 'stream') {
            // 如果没有图，就不做处理
            if (images.length === 0) {
                setStreamItems([]);
                return;
            }

            // 为了流体效果更好，我们把图片列表复制一份拼接起来 (loopData)
            // 这样图片少的时候也能有流动的效果
            // --- 【核心修改开始】 ---

            // 1. 先创建一个足够长的“基础列表”
            // 我们假设屏幕很宽，至少需要 15 张图才能铺满并留有余量
            let baseList = [...images];

            // 2. 为了配合 CSS 的 -50% 移动动画，我们需要两份一样的基础列表
            // 结构变成：[足够长的列表 A] + [足够长的列表 A (副本)]
            const loopData = [...baseList, ...baseList];
            setStreamItems(loopData);
            setIsFlowing(false);
            setHoveredIndex(null);
        } else {
            setStreamItems([]);
        }
    }, [viewMode, images]); // 注意：依赖项里加上 images

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

    // --- 【新增】点击 Upload 按钮，触发隐藏的文件框 ---
    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // --- 【新增】处理文件选择并上传 ---
    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // 1. 准备表单数据
        const formData = new FormData();
        formData.append('file', file);

        try {
            message.loading({ content: '正在上传...', key: 'uploading' });

            // 2. 发送请求 (拦截器会自动带上 Token)
            // 注意：文件上传不需要手动设置 Content-Type，axios 会自动处理 multipart/form-data
            const res = await axios.post('/api/image/upload', formData);

            if (res.data.code === 200) {
                message.success({ content: '上传成功！', key: 'uploading' });
                // console.log("上传结果:", res.data.data);
                // 【修改 3】上传成功后，重新获取一次列表，这样新图就能马上显示出来！
                fetchImages();

                // TODO: 暂时我们只打印结果，下一步我们将把新图片加到列表中
                // 你可以复制控制台里的 filePath 去浏览器验证
            } else {
                message.error({ content: res.data.msg || '上传失败', key: 'uploading' });
            }
        } catch (error) {
            console.error(error);
            message.error({ content: '上传出错，请检查网络', key: 'uploading' });
        } finally {
            // 清空文件框，允许重复上传同一张图
            event.target.value = '';
        }
    };

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
                        <div className="view-toggles">
                            <button
                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                            >
                                <i className="ri-grid-fill"></i>
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'stream' ? 'active' : ''}`}
                                onClick={() => setViewMode('stream')}
                                title="3D Stream View"
                            >
                                <i className="ri-film-line"></i>
                            </button>
                        </div>

                        {/* <button className="upload-btn"><i className="ri-upload-cloud-2-line"></i>Upload</button> */}
                        {/* 【修改】Upload 按钮绑定点击事件 */}
                        <button className="upload-btn" onClick={handleUploadClick}>
                            <i className="ri-upload-cloud-2-line"></i>Upload
                        </button>

                        {/* 【新增】隐藏的文件输入框 */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*" // 只接受图片
                            onChange={handleFileChange}
                        />

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
                            {/* 【修改 4】渲染真实的 images 数据 */}
                            {/* 注意：后端返回的字段是 thumbnailPath，我们需要拼上完整的 URL */}
                            {images.map((img) => (
                                <div className="card-item" key={img.id}>
                                    <img
                                        // 拼接后端地址 + 缩略图路径
                                        src={`http://localhost:8080${img.thumbnailPath}`}
                                        className="card-img"
                                        alt="user upload"
                                        loading="lazy"
                                    />
                                    <div className="card-overlay">
                                        <div className="card-info">
                                            {/* 暂时没有标题，先显示上传时间或文件名 */}
                                            <h4>{new Date(img.uploadTime).toLocaleDateString()}</h4>
                                            {/* 标签功能还没做，暂时留空或写死 */}
                                            <span className="ai-tag">#Photo</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* 如果没有图片，显示一点提示 */}
                            {images.length === 0 && (
                                <div style={{ color: '#666', padding: '2rem' }}>
                                    还没有照片，快去上传第一张吧！
                                </div>
                            )}
                        </div>
                    )}

                    {viewMode === 'stream' && (
                        <div
                            ref={streamWrapperRef}
                            className={`stream-wrapper ${isFlowing ? 'is-flowing' : ''}`}
                            style={{ width: `${streamItems.length * 160}px` }}
                        >
                            {streamItems.map((img, index) => (
                                <div
                                    className={`card-item card-in-stream ${hoveredIndex === index ? 'is-active' : ''}`}
                                    // 注意：因为我们复制了数据，id会重复，所以key要加上index
                                    key={`${img.id}-${index}`}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                >
                                    {/* 【核心修改】拼接后端地址 + 缩略图路径 */}
                                    <img
                                        src={`http://localhost:8080${img.thumbnailPath}`}
                                        className="card-img"
                                        alt="stream item"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main >
        </div >
    );
};

export default Home;