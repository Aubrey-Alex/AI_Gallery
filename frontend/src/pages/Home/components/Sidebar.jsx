import React from 'react';

const Sidebar = ({ viewMode, showingFavorites, timelineTitle, tags, onMenuClick, onTagClick }) => {
    return (
        <aside className="sidebar">
            <div className="logo">
                <i className="ri-planet-line" style={{ fontSize: '1.6rem' }}></i>
                <span>AI Gallery</span>
            </div>
            <div className="menu-group">
                <div className="menu-title">Library</div>
                {/* 全部照片 */}
                <div
                    className={`menu-item ${viewMode === 'grid' && !showingFavorites ? 'active' : ''}`}
                    onClick={() => onMenuClick('all')}
                >
                    <i className="ri-gallery-view-2"></i><span>All Photos</span>
                </div>
                {/* 收藏夹 */}
                <div
                    className={`menu-item ${viewMode === 'grid' && showingFavorites ? 'active' : ''}`}
                    onClick={() => onMenuClick('favorites')}
                >
                    <i className="ri-heart-3-line"></i><span>Favorites</span>
                </div>
            </div>
            <div className="menu-group">
                <div className="menu-title">My Tags</div>
                {tags.length > 0 ? (
                    tags.map((tag, index) => (
                        <div
                            className={`menu-item ${timelineTitle === tag.tagName && viewMode === 'timeline' ? 'active' : ''}`}
                            key={index}
                            onClick={() => onTagClick(tag.tagName)}
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
    );
};

export default Sidebar;