import React from 'react';

const GridView = ({
    images,
    selectedIds,
    onCardClick,
    onDoubleClick,
    onContextMenu,
    onToggleFavorite,
    onTagClick
}) => {
    return (
        <div className="grid-layout">
            {images.map((img) => {
                const isSelected = selectedIds.includes(img.id);
                return (
                    <div
                        className={`card-item ${isSelected ? 'is-selected' : ''}`}
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

                        {/* 展示图片 */}
                        <img
                            src={`${import.meta.env.VITE_IMG_BASE_URL}${img.thumbnailPath}`}
                            className="card-img"
                            alt={img.fileName}
                            loading="lazy"
                        />
                        {/* 底部展示信息 */}
                        <div className="card-overlay">
                            <div className="card-info">
                                <h4>{img.fileName || new Date(img.uploadTime).toLocaleDateString()}</h4>
                                {img.fileName && (
                                    <p style={{ fontSize: '0.8rem', color: '#aaa', margin: 0 }}>
                                        {new Date(img.uploadTime).toLocaleDateString()}
                                    </p>
                                )}
                                {/* 可以点击标签直接展示 */}
                                <div className="tags-row">
                                    {img.tags && img.tags.length > 0 ? (
                                        img.tags.slice(0, 3).map((tagObj, i) => (
                                            <span
                                                className="ai-tag"
                                                key={i}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onTagClick(tagObj.tagName);
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                #{tagObj.tagName}
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

            {/* 空状态处理 */}
            {images.length === 0 && (
                <div style={{ color: '#666', padding: '2rem' }}>
                    还没有照片，快去上传第一张吧！
                </div>
            )}
        </div>
    );
};

export default GridView;