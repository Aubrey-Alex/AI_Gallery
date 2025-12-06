// src/components/AIUploadModal/AIUploadModal.jsx
import React, { useState, useRef } from 'react';
import './AIUploadModal.css';

const AIUploadModal = ({ isOpen, onClose, onFileSelect, uploadState = 'idle', statusText = '' }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        // 只有在空闲状态才允许拖拽交互
        if (uploadState === 'idle') setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        // 只有在空闲状态才允许放下文件
        if (uploadState === 'idle') {
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                onFileSelect(files);
            }
        }
    };

    const handleFileChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFileSelect(files);
        }
        // 无论成功与否，选完就清空，允许下次重复选同个文件
        e.target.value = '';
    };

    // 如果不在 open 状态，不渲染内容
    return (
        <div className={`ai-upload-overlay ${isOpen ? 'active' : ''}`}>
            {/* 只有 idle 状态允许关闭，扫描中禁止关闭 */}
            {uploadState === 'idle' && (
                <button className="close-btn" onClick={onClose}>
                    <i className="ri-close-line"></i>
                </button>
            )}

            <div
                // 根据状态切换 class
                className={`upload-box ${uploadState === 'scanning' ? 'scanning' : 'idle'}`}
                style={{
                    borderColor: isDragOver ? '#FF5722' : '',
                    transform: isDragOver ? 'scale(1.05)' : 'scale(1)'
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                // 只有 idle 状态点击才触发文件选择
                onClick={() => {
                    if (uploadState === 'idle' && fileInputRef.current) {
                        fileInputRef.current.click();
                    }
                }}
            >
                {/* 扫描光束 */}
                <div className="scan-beam"></div>

                <div className="upload-content">
                    {/* 根据 uploadState 渲染不同内容 */}
                    {uploadState === 'idle' ? (
                        <>
                            <i className="ri-upload-cloud-2-line upload-icon"></i>
                            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>
                                {isDragOver ? "Release to Upload" : "Drop Photos Here"}
                            </h3>
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>
                                Or click to initiate scan
                            </p>
                        </>
                    ) : (
                        <>
                            {/* 扫描时的加载动画 */}
                            <i className="ri-loader-4-line upload-icon" style={{ animation: 'spin 1s linear infinite' }}></i>
                            <p className="status-text">{statusText}</p>

                            {/* 假进度条 */}
                            <div style={{ width: '60%', height: '4px', background: '#333', marginTop: '15px', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    background: '#FF5722',
                                    animation: 'progress 2s ease-in-out infinite'
                                }}></div>
                            </div>
                        </>
                    )}

                    {/* 隐藏的 input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default AIUploadModal;