import React from 'react';

const TimelineView = ({
    images,
    title,
    selectedIds,
    onCardClick,
    onDoubleClick,
    onContextMenu,
    onToggleFavorite
}) => {
    return (
        <div className="timeline-view">
            <div className="timeline-header">
                <h2>{title}</h2>
                <span className="subtitle">Filtered by Tag</span>
            </div>

            <div className="masonry-grid">
                {images.map((img) => {
                    const isSelected = selectedIds.includes(img.id);
                    return (
                        <div
                            className={`masonry-item ${isSelected ? 'is-selected' : ''}`}
                            key={img.id}
                            onClick={() => onCardClick(img.id)}
                            onDoubleClick={() => onDoubleClick(img)}
                            onContextMenu={(e) => onContextMenu(e, img.id)}
                        >
                            {/* 选中打勾 */}
                            {isSelected && (
                                <div className="check-icon">
                                    <i className="ri-check-line"></i>
                                </div>
                            )}

                            {/* 收藏显示爱心 */}
                            <div
                                className={`favorite-btn ${img.isFavorite === 1 ? 'active' : ''}`}
                                onClick={(e) => onToggleFavorite(e, img)}
                            >
                                <i className={img.isFavorite === 1 ? "ri-heart-3-fill" : "ri-heart-3-line"}></i>
                            </div>

                            {/* 瀑布流展示图片 */}
                            <img
                                src={`${import.meta.env.VITE_IMG_BASE_URL}${img.thumbnailPath}`}
                                className="masonry-img"
                                alt="timeline item"
                            />
                            {/* 只展示标签 */}
                            <div className="card-overlay">
                                <div className="card-info">
                                    <h4>{new Date(img.uploadTime).toLocaleDateString()}</h4>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 空状态处理 */}
            {images.length === 0 && (
                <div style={{ color: '#666', padding: '2rem' }}>该标签下暂无照片</div>
            )}
        </div>
    );
};

export default TimelineView;