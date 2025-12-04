import React from 'react';

const GridView = ({
    images,
    selectedIds,
    onCardClick,
    onDoubleClick,
    onContextMenu,
    onToggleFavorite,
    onTagClick // 点击图片上的小标签
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
                        {isSelected && (
                            <div className="check-icon">
                                <i className="ri-check-line"></i>
                            </div>
                        )}

                        <div
                            className={`favorite-btn ${img.isFavorite === 1 ? 'active' : ''}`}
                            onClick={(e) => onToggleFavorite(e, img)}
                        >
                            <i className={img.isFavorite === 1 ? "ri-heart-3-fill" : "ri-heart-3-line"}></i>
                        </div>

                        <img
                            src={img.thumbnailPath}
                            className="card-img"
                            alt={img.fileName}
                            loading="lazy"
                        />
                        <div className="card-overlay">
                            <div className="card-info">
                                <h4>{img.fileName || new Date(img.uploadTime).toLocaleDateString()}</h4>
                                {img.fileName && (
                                    <p style={{ fontSize: '0.8rem', color: '#aaa', margin: 0 }}>
                                        {new Date(img.uploadTime).toLocaleDateString()}
                                    </p>
                                )}
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

            {images.length === 0 && (
                <div style={{ color: '#666', padding: '2rem' }}>
                    还没有照片，快去上传第一张吧！
                </div>
            )}
        </div>
    );
};

export default GridView;