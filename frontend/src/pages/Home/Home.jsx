import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // 引入 axios
import './Home.css';
import { message, Modal, Select } from 'antd'; // 引入 Modal 和 Select
import PhotoEditorModal from '../../components/PhotoEditorModal/PhotoEditorModal';
import AIUploadModal from '../../components/AIUploadModal/AIUploadModal';

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({ username: 'Guest' });
    // 修改 viewMode 状态，增加 'timeline'
    // 默认还是 'grid'
    const [viewMode, setViewMode] = useState('grid');

    // 新增状态：当前选中的标签名，用于显示在瀑布流标题上
    const [timelineTitle, setTimelineTitle] = useState('All Photos');

    const [tags, setTags] = useState([]); // 存储侧边栏标签列表
    const [currentTag, setCurrentTag] = useState(null);

    // 【新增】文件选择器的引用
    const fileInputRef = useRef(null);

    // 编辑器相关状态
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingImage, setEditingImage] = useState(null);

    const searchInputRef = useRef(null);

    // --- 新增状态：控制 AI 上传弹窗 ---
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadState, setUploadState] = useState('idle'); // idle, scanning, success
    const [uploadStatusText, setUploadStatusText] = useState('');

    // 搜索执行函数
    const handleSearch = () => {
        const keyword = searchInputRef.current.value.trim();
        if (keyword) {
            fetchImages(keyword);
        } else {
            // 如果清空了搜索框并回车，就查全部
            fetchImages(null);
        }
    };

    // 3. 【新增】打开编辑器的辅助函数
    const handleOpenEditor = (img) => {
        setEditingImage(img);
        setIsEditorOpen(true);
        setContextMenu(null); // 如果是从右键打开的，顺便关掉菜单
    };

    // 【修改点 1】新增状态：用来精准控制谁被悬停，解决闪烁问题
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const streamWrapperRef = useRef(null);
    const [streamItems, setStreamItems] = useState([]);
    const [isFlowing, setIsFlowing] = useState(false);
    // --- 【新增】多选与标签相关状态 ---
    const [selectedIds, setSelectedIds] = useState([]); // 存储被选中的图片ID
    const [contextMenu, setContextMenu] = useState(null); // 存储右键菜单位置 {x, y}
    const [isTagModalOpen, setIsTagModalOpen] = useState(false); // 标签弹窗开关
    const [inputTags, setInputTags] = useState([]); // 用户输入的标签

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

    // 获取标签列表
    const fetchTags = async () => {
        try {
            const res = await axios.get('/api/tag/list');
            if (res.data.code === 200) {
                setTags(res.data.data);
            }
        } catch (error) {
            console.error("获取标签失败", error);
        }
    };

    // 【修改 1】把原来的假数据 rawImages 删掉或注释掉，换成 state
    const [images, setImages] = useState([]);

    // 【修改】fetchImages 支持参数
    const fetchImages = async (query = null) => {
        try {
            // query 可能是 tag (侧边栏) 也可能是 keyword (搜索框)
            // 这里我们统称为 query
            const url = query
                ? `/api/image/list?keyword=${encodeURIComponent(query)}` // 后端接口已经改成 keyword 了
                : '/api/image/list';

            const res = await axios.get(url);
            if (res.data.code === 200) {
                setImages(res.data.data);

                // 【核心优化】搜索后的视图跳转逻辑
                if (query) {
                    setViewMode('timeline'); // 自动切到瀑布流
                    setTimelineTitle(`"${query}"`); // 更新标题
                    setCurrentTag(null); // 清除侧边栏的选中状态，避免混淆
                } else {
                    setViewMode('grid'); // 查全部时回到网格
                    setCurrentTag(null);
                }
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
            fetchTags(); // 【新增】同时也获取标签
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

    // --- 最终版：智能上传逻辑 (文件校验 + 中文文案 + 并发控制) ---
    const handleSmartUpload = async (files) => {
        if (!files || files.length === 0) return;

        // 1. 【文件校验】
        const MAX_SIZE = 50 * 1024 * 1024; // 50MB

        const validFiles = Array.from(files).filter(file => {
            // 校验格式：MIME type 或 后缀名
            const isMimeTypeImage = file.type.startsWith('image/');
            const fileName = file.name.toLowerCase();
            const isExtensionImage = /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg|tiff|tif|ico|heic|heif|raw|arw|dng|cr2|nef)$/.test(fileName);

            if (!isMimeTypeImage && !isExtensionImage) {
                message.error(`"${file.name}" 不是有效的图片文件，已跳过`);
                return false;
            }

            // 校验大小
            if (file.size > MAX_SIZE) {
                message.error(`"${file.name}" 超过 50MB，暂不支持`);
                return false;
            }

            return true;
        });

        if (validFiles.length === 0) return;

        // 2. 【进入扫描模式】
        setUploadState('scanning');
        setUploadStatusText(`正在建立量子通道，准备传输 ${validFiles.length} 个文件...`);

        // 3. 【AI 步骤文案】
        const aiSteps = [
            "正在进行加密传输...",
            "AI 引擎正在分析像素结构...",
            "正在进行对象识别...",
            "生成智能语义标签...",
            "正在进行最终资源归档..."
        ];

        let stepIndex = 0;
        // 如果文件很多，不要让 AI 文案太快结束，根据文件数量动态调整定时器
        const textInterval = setInterval(() => {
            if (stepIndex < aiSteps.length) {
                setUploadStatusText(aiSteps[stepIndex]);
                stepIndex++;
            }
        }, 800);

        let successCount = 0;
        let failCount = 0;
        const results = [];

        try {
            // 4. 【核心修改：并发控制】
            const BATCH_SIZE = 3; // 每次并发 3 张 (推荐值：3~5)

            for (let i = 0; i < validFiles.length; i += BATCH_SIZE) {
                // 切片：获取当前这一批的 3 个文件
                const batch = validFiles.slice(i, i + BATCH_SIZE);

                // (可选) 如果文件确实很多，可以在界面上实时更新具体的进度
                if (validFiles.length > 5) {
                    setUploadStatusText(`正在传输批次 ${Math.ceil((i + 1) / BATCH_SIZE)} / ${Math.ceil(validFiles.length / BATCH_SIZE)} ...`);
                }

                // 并行处理这一批
                const batchResults = await Promise.all(
                    batch.map(async (file) => {
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                            const res = await axios.post('/api/image/upload', formData);
                            if (res.data.code === 200) return true;
                            return false;
                        } catch (e) { return false; }
                    })
                );

                // 把这一批的结果存起来
                results.push(...batchResults);

                // (可选) 稍微停顿 300ms，防止请求发得太快后端顶不住，也让动画更流畅
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // 统计结果
            successCount = results.filter(r => r).length;
            failCount = results.length - successCount;

        } catch (error) {
            console.error("Batch upload error", error);
        } finally {
            // 5. 【扫尾工作】
            clearInterval(textInterval);

            setUploadStatusText(
                failCount === 0
                    ? "分析完成！系统同步完毕。"
                    : `部分完成。${failCount} 张上传失败。`
            );

            setTimeout(() => {
                setIsUploadModalOpen(false);
                setUploadState('idle');
                fetchImages();
                fetchTags();
                if (successCount > 0) message.success(`成功导入 ${successCount} 张图片`);
            }, 1500);
        }
    };

    // --- 【核心】保存编辑后的图片逻辑 ---
    const handleSaveEditedImage = async (base64Data) => {
        const hideLoading = message.loading('正在保存新图片...', 0);

        try {
            const res = await axios.post('/api/image/save-edited', {
                base64: base64Data
            });

            if (res.data.code === 200) {
                message.success('编辑成功！已保存为新图片');
                setIsEditorOpen(false); // 关闭弹窗

                // 刷新列表，让新图片显示在最前面
                fetchImages(currentTag);

            } else {
                message.error(res.data.msg || '保存失败');
            }
        } catch (error) {
            console.error("保存出错:", error);
            message.error('保存请求异常');
        } finally {
            hideLoading();
        }
    };

    // --- 【修改后】更健壮的删除逻辑 ---
    const handleDelete = async () => {
        if (selectedIds.length === 0) return;

        if (!window.confirm(`确定要删除这 ${selectedIds.length} 张图片吗？`)) {
            return;
        }

        const hideLoading = message.loading('正在删除...', 0);

        try {
            // 1. 使用 allSettled，即使有个别失败，也不会中断整个流程
            const results = await Promise.allSettled(selectedIds.map(id => axios.delete(`/api/image/${id}`)));

            // 2. 统计成功和失败的数量
            const successCount = results.filter(r => r.status === 'fulfilled' && r.value.data.code === 200).length;
            const failCount = selectedIds.length - successCount;

            // 3. 根据结果显示提示
            if (failCount === 0) {
                message.success('删除成功');
            } else if (successCount > 0) {
                message.warning(`部分完成：成功 ${successCount} 张，失败 ${failCount} 张`);
            } else {
                message.error('删除失败，请检查后端日志');
            }

            // 4. 清空选中状态
            setSelectedIds([]);
            setContextMenu(null);

        } catch (error) {
            console.error(error);
            message.error('请求发生异常');
        } finally {
            // 5. 【核心修复】无论成功失败，都在 finally 里刷新列表
            // 这样那些删除成功的图片就会从界面上消失
            hideLoading();
            fetchImages(currentTag);
            fetchTags();
        }
    };

    /// --- 【修改】支持批量上传 ---
    const handleFileChange = async (event) => {
        const files = event.target.files; // 获取所有选中的文件 (FileList)
        if (!files || files.length === 0) return;

        // 为了用户体验，我们显示一个总的加载提示
        const hideLoading = message.loading({ content: `正在上传 ${files.length} 张图片...`, key: 'uploading', duration: 0 });

        let successCount = 0;
        let failCount = 0;

        try {
            // 使用 Promise.all 并发上传所有图片
            // 将 FileList 转换为数组进行 map
            const uploadPromises = Array.from(files).map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);

                try {
                    const res = await axios.post('/api/image/upload', formData);
                    if (res.data.code === 200) {
                        successCount++;
                        return true;
                    } else {
                        failCount++;
                        return false;
                    }
                } catch (error) {
                    console.error(`文件 ${file.name} 上传失败:`, error);
                    failCount++;
                    return false;
                }
            });

            // 等待所有上传完成
            await Promise.all(uploadPromises);

            // 结果反馈
            if (failCount === 0) {
                message.success({ content: `成功上传 ${successCount} 张图片！`, key: 'uploading' });
            } else {
                message.warning({ content: `完成：${successCount} 张成功，${failCount} 张失败`, key: 'uploading' });
            }

            // 上传完成后，刷新列表
            fetchImages();

        } catch (error) {
            console.error("批量上传过程出错:", error);
            message.error({ content: '批量上传异常', key: 'uploading' });
        } finally {
            // 无论成功失败，都清空文件选择框，允许再次上传同样的文件
            event.target.value = '';
        }
    };

    // --- 1. 处理图片点击 (多选逻辑) ---
    const handleCardClick = (id) => {
        // 如果右键菜单打开中，先关闭它
        if (contextMenu) setContextMenu(null);

        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id); // 反选
            } else {
                return [...prev, id]; // 选中
            }
        });
    };

    // --- 2. 处理右键点击 (呼出菜单) ---
    const handleContextMenu = (e, id) => {
        e.preventDefault(); // 阻止浏览器默认右键菜单

        // 如果当前图片还没被选中，自动帮用户选中它
        if (!selectedIds.includes(id)) {
            setSelectedIds(prev => [...prev, id]);
        }

        // 设置菜单位置
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            targetId: id
        });
    };

    // --- 3. 点击页面其他地方关闭菜单 ---
    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // --- 4. 提交标签到后端 ---
    const handleAddTags = async () => {
        if (inputTags.length === 0) {
            message.warning("请输入至少一个标签");
            return;
        }

        try {
            const res = await axios.post('/api/tag/batch-add', {
                imageIds: selectedIds,
                tags: inputTags
            });

            if (res.data.code === 200) {
                message.success(`成功给 ${selectedIds.length} 张图片打上标签！`);
                setIsTagModalOpen(false); // 关闭弹窗
                setInputTags([]); // 清空输入
                setSelectedIds([]); // 清空选中

                fetchImages();
                fetchTags();
            } else {
                message.error(res.data.msg);
            }
        } catch (error) {
            console.error(error);
            message.error("打标签失败");
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
                    {/* <div className="menu-item active"><i className="ri-gallery-view-2"></i><span>All Photos</span></div> */}
                    <div className={`menu-item ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => fetchImages(null)}>
                        <i className="ri-gallery-view-2"></i><span>All Photos</span>
                    </div>
                    <div className="menu-item"><i className="ri-heart-3-line"></i><span>Favorites</span></div>
                </div>
                <div className="menu-group">
                    <div className="menu-title">My Tags</div>
                    {tags.length > 0 ? (
                        tags.map((tag, index) => (
                            <div
                                className={`menu-item ${timelineTitle === tag.tagName && viewMode === 'timeline' ? 'active' : ''}`}
                                key={index}
                                // 【核心】点击标签 -> 查筛选数据 -> 变 Timeline
                                onClick={() => fetchImages(tag.tagName)}
                            >
                                <i className="ri-hashtag"></i>
                                <span>{tag.tagName}</span>
                                <div className="ai-tag-badge">{tag.count}</div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '10px', color: '#444', fontSize: '0.8rem' }}>暂无标签</div>
                    )}
                </div>
            </aside>

            <main className="main-content">
                <header className="top-bar">
                    <div className="search-container">
                        <input
                            ref={searchInputRef} // 绑定 Ref
                            type="text"
                            className="search-input"
                            placeholder="搜索图片或标签..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch(); // 回车触发
                                }
                            }}
                        />
                        {/* 图标绑定点击事件 */}
                        <i
                            className="ri-sparkling-2-line search-icon"
                            style={{ cursor: 'pointer' }}
                            onClick={handleSearch}
                        ></i>
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

                        {/* 【修改】Upload 按钮只负责打开 Modal */}
                        <button className="upload-btn" onClick={() => setIsUploadModalOpen(true)}>
                            <i className="ri-upload-cloud-2-line"></i>Upload
                        </button>

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
                            {/* 【修改】Grid 渲染部分：整合多选和右键菜单 */}
                            {images.map((img) => {
                                // 判断当前图片是否被选中
                                const isSelected = selectedIds.includes(img.id);

                                return (
                                    <div
                                        // 选中时添加 is-selected 类 (CSS会给它加橙色边框)
                                        className={`card-item ${isSelected ? 'is-selected' : ''}`}
                                        key={img.id}
                                        // 绑定左键点击事件 (多选)
                                        onClick={() => handleCardClick(img.id)}
                                        // 【新增】双击打开编辑器
                                        onDoubleClick={() => handleOpenEditor(img)}
                                        // 绑定右键点击事件 (呼出菜单)
                                        onContextMenu={(e) => handleContextMenu(e, img.id)}
                                    >
                                        {/* 选中时的对勾图标 */}
                                        {isSelected && (
                                            <div className="check-icon">
                                                <i className="ri-check-line"></i>
                                            </div>
                                        )}

                                        <img
                                            src={`http://localhost:8080${img.thumbnailPath}`}
                                            className="card-img"
                                            alt="user upload"
                                            loading="lazy"
                                        />
                                        <div className="card-overlay">
                                            <div className="card-info">
                                                {/* 【修改】优先显示文件名，没有文件名才显示日期 */}
                                                <h4>{img.fileName || new Date(img.uploadTime).toLocaleDateString()}</h4>

                                                {/* 【新增】如果显示了文件名，可以在下面用小字显示日期 */}
                                                {img.fileName && (
                                                    <p style={{ fontSize: '0.8rem', color: '#aaa', margin: 0 }}>
                                                        {new Date(img.uploadTime).toLocaleDateString()}
                                                    </p>
                                                )}

                                                {/* 【修改】渲染真实标签 */}
                                                <div className="tags-row">
                                                    {img.tags && img.tags.length > 0 ? (
                                                        img.tags.slice(0, 3).map((tagObj, i) => (
                                                            <span
                                                                className="ai-tag"
                                                                key={i}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCurrentTag(tagObj.tagName); // 【修改】取 .tagName
                                                                }}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                #{tagObj.tagName} {/* 【修改】取 .tagName */}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="ai-tag" style={{ opacity: 0.5 }}>#无标签</span>
                                                    )}
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* 空状态提示 */}
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
                                    // 【新增】双击打开编辑器
                                    onDoubleClick={() => handleOpenEditor(img)}
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

                {/* 【新增】Timeline View (瀑布流) */}
                {viewMode === 'timeline' && (
                    <div className="timeline-view">
                        <div className="timeline-header">
                            <h2>{timelineTitle}</h2>
                            <span className="subtitle">Filtered by Tag</span>
                        </div>

                        <div className="masonry-grid">
                            {images.map((img) => {
                                // 1. 判断是否选中 (为了保持多选功能一致)
                                const isSelected = selectedIds.includes(img.id);

                                return (
                                    <div
                                        // 2. 添加选中样式类
                                        className={`masonry-item ${isSelected ? 'is-selected' : ''}`}
                                        key={img.id}

                                        // 3. 【核心修复】补齐三个交互事件
                                        onClick={() => handleCardClick(img.id)}           // 左键多选
                                        onDoubleClick={() => handleOpenEditor(img)}       // 双击编辑
                                        onContextMenu={(e) => handleContextMenu(e, img.id)} // 右键菜单
                                    >
                                        {/* 4. 添加选中时的对勾图标 */}
                                        {isSelected && (
                                            <div className="check-icon">
                                                <i className="ri-check-line"></i>
                                            </div>
                                        )}

                                        <img
                                            src={`http://localhost:8080${img.thumbnailPath}`}
                                            className="masonry-img"
                                            alt="timeline item"
                                        />
                                        <div className="card-overlay">
                                            <div className="card-info">
                                                <h4>{new Date(img.uploadTime).toLocaleDateString()}</h4>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {images.length === 0 && (
                            <div style={{ color: '#666', padding: '2rem' }}>该标签下暂无照片</div>
                        )}
                    </div>
                )}

                {/* --- 右键菜单 --- */}
                {contextMenu && (
                    <div
                        className="context-menu"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 【新增】编辑按钮 */}
                        <div className="context-menu-item" onClick={() => {
                            // 根据 ID 找到图片对象
                            const targetImg = images.find(i => i.id === contextMenu.targetId);
                            if (targetImg) handleOpenEditor(targetImg);
                        }}>
                            <i className="ri-edit-2-line"></i> 编辑图片
                        </div>
                        <div className="context-menu-item" onClick={() => {
                            setIsTagModalOpen(true);
                            setContextMenu(null);
                        }}>
                            <i className="ri-price-tag-3-line"></i> 添加标签 ({selectedIds.length})
                        </div>
                        <div className="context-menu-item"
                            style={{ color: '#ff4d4f' }}
                            // 【修改】绑定删除事件
                            onClick={() => {
                                handleDelete();
                                // setContextMenu(null); // handleDelete 里已经关了，这里可以不写
                            }}>
                            <i className="ri-delete-bin-line"></i> 删除图片
                        </div>
                    </div>
                )}

                {/* --- 打标签弹窗 --- */}
                <Modal
                    title="添加自定义标签"
                    open={isTagModalOpen}
                    onOk={handleAddTags}
                    onCancel={() => setIsTagModalOpen(false)}
                    okText="确认添加"
                    cancelText="取消"
                    centered
                >
                    <p style={{ marginBottom: '10px' }}>正在为 {selectedIds.length} 张图片添加标签：</p>
                    <Select
                        mode="tags"
                        style={{ width: '100%' }}
                        placeholder="输入标签后按回车 (如: 杭州, 旅游)"
                        value={inputTags}
                        onChange={setInputTags}
                        tokenSeparators={[',', ' ']}
                    />
                </Modal>

                {/* --- 【新增】渲染 AI 上传弹窗 --- */}
                <AIUploadModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onFileSelect={(files) => handleSmartUpload(files)} // 连接处理函数
                    uploadState={uploadState}      // 传入状态：idle 或 scanning
                    statusText={uploadStatusText}  // 传入扫描文字
                />

                {/* --- 【新增】图片编辑器 Modal --- */}
                {/* 这个组件通常放在最外层或者 main 的最后，只要它被渲染出来就行 */}
                <PhotoEditorModal
                    isOpen={isEditorOpen}
                    onClose={() => setIsEditorOpen(false)}
                    // 传入大图路径 (filePath)
                    // imageSrc={editingImage ? `http://localhost:8080${editingImage.filePath}` : ''}
                    // 【修改】不再传 imageSrc 字符串，而是传整个 image 对象
                    imageObj={editingImage}
                    onSave={handleSaveEditedImage}
                />

            </main >
        </div >
    );
};

export default Home;