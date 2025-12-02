import React, { useRef } from 'react';

const TopBar = ({
    user,
    viewMode,
    onSearch,
    onViewChange,
    onUploadClick,
    onLogout
}) => {
    const searchInputRef = useRef(null);

    const handleSearchTrigger = () => {
        const keyword = searchInputRef.current.value.trim();
        onSearch(keyword); // 将结果传回父组件
    };

    return (
        <header className="top-bar">
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

                <button className="upload-btn" onClick={onUploadClick}>
                    <i className="ri-upload-cloud-2-line"></i>Upload
                </button>

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