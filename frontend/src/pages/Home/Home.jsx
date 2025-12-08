import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/request';
import { message, Modal, Select } from 'antd';
import { getPhotoDate } from '../../utils/processPhotoDate';

// 引入样式
import './Home.css';

// 引入拆分组件
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import GridView from './views/GridView';
import StreamView from './views/StreamView';
import TimelineView from './views/TimelineView';
import AiSearchOverlay from '../../components/AiSearch/AiSearchOverlay';
import PhotoEditorModal from '../../components/PhotoEditorModal/PhotoEditorModal';
import AIUploadModal from '../../components/AIUploadModal/AIUploadModal';

const Home = () => {
    const navigate = useNavigate();

    // 用户与视图
    const [user, setUser] = useState({ username: 'Guest' });
    const [viewMode, setViewMode] = useState('grid'); // grid, stream, timeline
    const [timelineTitle, setTimelineTitle] = useState('All Photos');
    const [showingFavorites, setShowingFavorites] = useState(false);

    // 数据
    const [images, setImages] = useState([]);
    const [tags, setTags] = useState([]);
    const [currentTag, setCurrentTag] = useState(null);

    // 交互与多选
    const [selectedIds, setSelectedIds] = useState([]);
    const [contextMenu, setContextMenu] = useState(null);

    // 弹窗
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingImage, setEditingImage] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadState, setUploadState] = useState('idle');
    const [uploadStatusText, setUploadStatusText] = useState('');
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [inputTags, setInputTags] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // 初始化
    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (!storedUser) {
            message.warning('请先登录');
            navigate('/welcome');
        } else {
            setUser(JSON.parse(storedUser));
            fetchImages();
            fetchTags();
        }
    }, [navigate]);

    // 点击页面任意处关闭右键菜单
    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // API 请求逻辑
    const fetchTags = async () => {
        try {
            const res = await axios.get('/api/tag/list');
            if (res.data.code === 200) setTags(res.data.data);
        } catch (error) {
            console.error("获取标签失败", error);
        }
    };

    const fetchImages = async (query = null, onlyFav = false) => {
        try {
            let url = '/api/image/list';
            const params = [];
            if (query) params.push(`keyword=${encodeURIComponent(query)}`);
            if (onlyFav) params.push(`onlyFavorites=true`);
            if (params.length > 0) url += '?' + params.join('&');

            const res = await axios.get(url);
            if (res.data.code === 200) {
                setImages(res.data.data);

                // 视图自动切换逻辑
                if (onlyFav) {
                    setTimelineTitle('My Favorites');
                    setViewMode('grid');
                    setShowingFavorites(true);
                    setCurrentTag(null);
                } else if (query) {
                    setViewMode('timeline');
                    setTimelineTitle(`"${query}"`);
                    setCurrentTag(null);
                } else {
                    // 回到全部
                    setViewMode('grid');
                    setCurrentTag(null);
                }
            }
        } catch (error) {
            console.error("获取图片列表失败:", error);
        }
    };

    // 交互处理函数
    const handleSearch = (keyword) => {
        if (keyword) {
            fetchImages(keyword);
        } else {
            fetchImages(null);
        }
    };

    // all与faviority展示切换
    const handleMenuClick = (type) => {
        if (type === 'all') {
            setShowingFavorites(false);
            setViewMode('grid');
            setCurrentTag(null);
            fetchImages(null);
        } else if (type === 'favorites') {
            fetchImages(null, true);
        }
    };

    // 标签展示切换
    const handleTagClick = (tagName) => {
        fetchImages(tagName);
    };

    // 选中卡片逻辑
    const handleCardClick = (id) => {
        // 先清除右键菜单
        if (contextMenu) setContextMenu(null);

        // 判断是否是手机端
        const isMobile = window.innerWidth <= 1024;

        // 判断当前是否已经是多选模式
        // 如果已经有选中的图片，那么无论手机还是电脑，点击都应该是加选/减选
        const isMultiSelectMode = selectedIds.length > 0;

        if (isMobile && !isMultiSelectMode) {
            // 手机端逻辑且当前没在多选：
            // 单击直接打开大图预览
            const targetImg = images.find(i => i.id === id);
            if (targetImg) {
                handleOpenEditor(targetImg);
            }
        } else {
            // 电脑端逻辑或者手机端正在多选中：
            // 保持原有的选中/取消选中逻辑
            setSelectedIds(prev => {
                if (prev.includes(id)) return prev.filter(item => item !== id);
                return [...prev, id];
            });
        }
    };

    // 开启编辑页面
    const handleOpenEditor = (targetImg) => {
        // 尝试从当前已加载的主列表(images)中查找该图片的完整信息
        // AI Search 返回的对象缺 tags/metadata，而 images 里的对象是完整版
        const fullImg = images.find(i => i.id === targetImg.id);

        // 如果找到了完整对象(fullImg)，就以它为主；
        // 既然 fullImg 能在主页网格正常打开，它一定有正确的 path
        // 如果没找到（比如搜的是还没加载出来的老图），就只能用 targetImg 保底
        const finalImg = fullImg || targetImg;

        setEditingImage(finalImg);
        setIsEditorOpen(true);
        setContextMenu(null);
    };

    // 右键点击图片
    const handleContextMenu = (e, id) => {
        e.preventDefault();
        if (!selectedIds.includes(id)) {
            setSelectedIds(prev => [...prev, id]);
        }
        setContextMenu({ x: e.clientX, y: e.clientY, targetId: id });
    };

    // 收藏/取消收藏
    const handleToggleFavorite = async (e, img) => {
        e.stopPropagation();
        setImages(prev => prev.map(item => {
            if (item.id === img.id) return { ...item, isFavorite: item.isFavorite === 1 ? 0 : 1 };
            return item;
        }));
        try {
            await axios.post(`/api/image/${img.id}/favorite`);
        } catch (error) {
            message.error("操作失败");
            fetchImages();
        }
    };

    // 核心业务逻辑：上传、删除、编辑、打标签 ---

    // 上传
    const handleSmartUpload = async (files) => {
        if (!files || files.length === 0) return;
        const MAX_SIZE = 50 * 1024 * 1024;
        const validFiles = Array.from(files).filter(file => {
            return file.size <= MAX_SIZE;
        });
        if (validFiles.length === 0) return;

        setUploadState('scanning');
        setUploadStatusText(`正在建立量子通道...`);

        // 模拟 AI 步骤文案
        const aiSteps = ["正在进行加密传输...", "AI 引擎分析像素...", "生成智能语义标签..."];
        let stepIndex = 0;
        const textInterval = setInterval(() => {
            if (stepIndex < aiSteps.length) {
                setUploadStatusText(aiSteps[stepIndex]);
                stepIndex++;
            }
        }, 800);

        let successCount = 0;
        const BATCH_SIZE = 3;
        try {
            for (let i = 0; i < validFiles.length; i += BATCH_SIZE) {
                const batch = validFiles.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                        // 智能解析真实时间
                        const realDate = await getPhotoDate(file);

                        if (realDate) {
                            formData.append('shootTime', realDate.getTime());
                        }
                    } catch (err) {
                        console.warn('时间解析失败，将使用服务器时间', err);
                    }

                    try {
                        const res = await axios.post('/api/image/upload', formData);
                        if (res.data.code === 200) successCount++;
                    } catch (e) { }
                }));
                // 模拟间隔
                await new Promise(r => setTimeout(r, 300));
            }
        } finally {
            clearInterval(textInterval);
            setUploadStatusText("分析完成！");
            setTimeout(() => {
                setIsUploadModalOpen(false);
                setUploadState('idle');
                fetchImages();
                fetchTags();
                if (successCount > 0) message.success(`成功导入 ${successCount} 张图片`);
            }, 1000);
        }
    };

    // 保存编辑后的照片
    const handleSaveEditedImage = async (base64Data) => {
        const hideLoading = message.loading('正在保存...', 0);
        try {
            const res = await axios.post('/api/image/save-edited', { base64: base64Data });
            if (res.data.code === 200) {
                message.success('编辑成功');
                setIsEditorOpen(false);
                fetchImages(currentTag);
            } else {
                message.error(res.data.msg);
            }
        } catch (error) {
            message.error('保存异常');
        } finally {
            hideLoading();
        }
    };

    // 删除照片
    const handleDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`确定删除 ${selectedIds.length} 张图片吗？`)) return;

        const hideLoading = message.loading('正在删除...', 0);
        try {
            await Promise.allSettled(selectedIds.map(id => axios.delete(`/api/image/${id}`)));
            message.success('操作结束');
            setSelectedIds([]);
            setContextMenu(null);
            fetchImages(currentTag);
            fetchTags();
        } finally {
            hideLoading();
        }
    };

    // 增加标签
    const handleAddTags = async () => {
        if (inputTags.length === 0) return;
        try {
            const res = await axios.post('/api/tag/batch-add', { imageIds: selectedIds, tags: inputTags });
            if (res.data.code === 200) {
                message.success('标签添加成功');
                setIsTagModalOpen(false);
                setInputTags([]);
                setSelectedIds([]);
                fetchImages();
                fetchTags();
            }
        } catch (e) { message.error("添加失败"); }
    };

    // 登出
    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('jwt_token');
        message.success('已退出');
        navigate('/welcome');
    };

    return (
        <div className="home-container">
            <div className={`sidebar-wrapper ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <Sidebar
                    viewMode={viewMode}
                    showingFavorites={showingFavorites}
                    timelineTitle={timelineTitle}
                    tags={tags}
                    onMenuClick={(type) => {
                        handleMenuClick(type);
                        // 手机端点击all/favorite后自动收起
                        setIsMobileMenuOpen(false);
                    }}
                    onTagClick={(tag) => {
                        handleTagClick(tag);
                        // 手机端点击标签后自动收起
                        setIsMobileMenuOpen(false);
                    }}
                />
                {/* 遮罩层：点击半透明背景关闭菜单 */}
                <div
                    className="mobile-sidebar-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            </div>

            <main className="main-content">
                {/* 顶栏 */}
                <TopBar
                    user={user}
                    viewMode={viewMode}
                    onSearch={handleSearch}
                    onViewChange={setViewMode}
                    onUploadClick={() => setIsUploadModalOpen(true)}
                    onLogout={handleLogout}
                    onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
                />

                {/* 视图切换 */}
                <div className={`gallery-viewport mode-${viewMode}`}>
                    {viewMode === 'grid' && (
                        <GridView
                            images={images}
                            selectedIds={selectedIds}
                            onCardClick={handleCardClick}
                            onDoubleClick={handleOpenEditor}
                            onContextMenu={handleContextMenu}
                            onToggleFavorite={handleToggleFavorite}
                            onTagClick={(tag) => {
                                setCurrentTag(tag);
                                fetchImages(tag);
                            }}
                        />
                    )}

                    {viewMode === 'stream' && (
                        <StreamView
                            images={images}
                            selectedIds={selectedIds}
                            onDoubleClick={handleOpenEditor}
                        />
                    )}

                    {viewMode === 'timeline' && (
                        <TimelineView
                            images={images}
                            title={timelineTitle}
                            selectedIds={selectedIds}
                            onCardClick={handleCardClick}
                            onDoubleClick={handleOpenEditor}
                            onContextMenu={handleContextMenu}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    )}
                </div>

                {/* --- 右键菜单 --- */}
                {contextMenu && (
                    <div
                        className="context-menu"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="context-menu-item" onClick={() => {
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
                        <div className="context-menu-item" style={{ color: '#ff4d4f' }} onClick={handleDelete}>
                            <i className="ri-delete-bin-line"></i> 删除图片
                        </div>
                    </div>
                )}

                {/* 各种弹窗 */}
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
                        placeholder="输入标签后按回车"
                        value={inputTags}
                        onChange={setInputTags}
                        tokenSeparators={[',', ' ']}
                    />
                </Modal>

                {/* 智能上传 */}
                <AIUploadModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onFileSelect={handleSmartUpload}
                    uploadState={uploadState}
                    statusText={uploadStatusText}
                />

                {/* 图片编辑 */}
                <PhotoEditorModal
                    isOpen={isEditorOpen}
                    onClose={() => setIsEditorOpen(false)}
                    imageObj={editingImage}
                    onSave={handleSaveEditedImage}
                />

                {/* AI搜索 */}
                <AiSearchOverlay
                    onNavigate={navigate}
                    onImageClick={handleOpenEditor}
                />
            </main>
        </div>
    );
};

export default Home;