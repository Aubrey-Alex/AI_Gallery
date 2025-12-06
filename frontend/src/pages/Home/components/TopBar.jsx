import React, { useRef } from 'react';

const TopBar = ({
    user,
    viewMode,
    onSearch,
    onViewChange,
    onUploadClick,
    onLogout,
    onOpenMobileMenu
}) => {
    const searchInputRef = useRef(null);

    // 搜索
    const handleSearchTrigger = () => {
        const keyword = searchInputRef.current.value.trim();
        onSearch(keyword); // 将结果传回父组件
    };

    return (
        <header className="top-bar">
            {/* 移动端汉堡菜单按钮 */}
            <div className="mobile-menu-btn" onClick={onOpenMobileMenu}>
                <i className="ri-menu-line"></i>
            </div>
            {/* 搜索框 */}
            <div className="search-container">
                <input
                    ref={searchInputRef}
                    type="text"
                    className="search-input"
                    placeholder="搜索图片或标签..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearchTrigger();
                    }}
                />
                <i
                    className="ri-sparkling-2-line search-icon"
                    style={{ cursor: 'pointer' }}
                    onClick={handleSearchTrigger}
                ></i>
            </div>
            <div className="top-actions">
                {/* 视图 */}
                <div className="view-toggles">
                    <button
                        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => onViewChange('grid')}
                        title="Grid View"
                    >
                        <i className="ri-grid-fill"></i>
                    </button>
                    <button
                        className={`view-btn ${viewMode === 'stream' ? 'active' : ''}`}
                        onClick={() => onViewChange('stream')}
                        title="3D Stream View"
                    >
                        <i className="ri-film-line"></i>
                    </button>
                </div>

                {/* 上传按钮 */}
                <button className="upload-btn" onClick={onUploadClick}>
                    <i className="ri-upload-cloud-2-line"></i><span className="btn-text">Upload</span>
                </button>

                {/* 用户信息 */}
                <div
                    className="user-greeting-wrapper"
                    onClick={onLogout}
                    title="Click to Logout"
                >
                    <span className="greeting-text">Hello,</span>
                    <span className="username-text">{user.username || 'Guest'}</span>
                </div>
            </div>
        </header>
    );
};

export default TopBar;