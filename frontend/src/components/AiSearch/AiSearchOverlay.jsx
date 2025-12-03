// src/components/AiSearch/AiSearchOverlay.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from '../../utils/request';
import './AiSearchOverlay.css';

// 接收 onImageClick 属性
const AiSearchOverlay = ({ onImageClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('idle'); // idle, searching, complete
    const [loadingText, setLoadingText] = useState('');
    const [results, setResults] = useState([]);
    const [confidence, setConfidence] = useState(0.65);
    const inputRef = useRef(null);

    // 每次打开自动聚焦
    useEffect(() => {
        if (isOpen && inputRef.current) inputRef.current.focus();
    }, [isOpen]);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setStatus('idle');
            setQuery('');
            setResults([]);
        }
    };

    const getFullUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `http://localhost:8080${path}`;
    };

    const handleSearch = async (e) => {
        if (e.key === 'Enter' && query.trim()) {
            setStatus('searching');
            setLoadingText('正在建立神经连接...');
            try {
                // 模拟 API (替换为你真实的 API)
                const res = await axios.post('/api/mcp/search', { query });

                // 模拟延迟
                await new Promise(r => setTimeout(r, 800));

                if (res.data && res.data.code === 200) {
                    // 确保 score 是数字
                    const data = res.data.data.map(item => ({ ...item, score: parseFloat(item.score) }));
                    setResults(data);
                } else {
                    setResults([]);
                }
                setStatus('complete');
            } catch (error) {
                console.error(error);
                setLoadingText('连接中断');
                setTimeout(() => setStatus('idle'), 1000);
            }
        }
    };

    const getConfidenceClass = (conf) => {
        if (conf >= 0.80) return 'high-precision';
        if (conf <= 0.40) return 'low-inspiration';
        return '';
    };

    const filteredResults = results.filter(item => item.score >= confidence);

    return (
        <>
            <div className={`ai-fab ${isOpen ? 'hidden' : ''}`} onClick={toggleOpen}>
                <div className="ai-fab-ring"></div>
                <i className="ri-brain-line"></i>
            </div>

            {isOpen && (
                <div className="ai-overlay">
                    <div className="ai-backdrop" onClick={toggleOpen}></div>
                    <div className="ai-content">
                        {/* --- 修改开始：头部结构重构 --- */}
                        <div className="ai-header">
                            {/* 新增一个包装容器 ai-search-bar */}
                            <div className="ai-search-bar">
                                <div className="ai-icon-pulse">
                                    <i className="ri-search-2-line"></i>
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="ai-input"
                                    placeholder="输入关键词或描述..."
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={handleSearch}
                                />
                                {query && (
                                    <button className="ai-clear-btn" onClick={() => setQuery('')}>
                                        <i className="ri-close-circle-fill"></i>
                                    </button>
                                )}
                            </div>

                            {/* 关闭按钮独立在搜索条之外，作为大退出的操作 */}
                            <button className="ai-close-main" onClick={toggleOpen}>
                                <i className="ri-close-line"></i>
                            </button>
                        </div>

                        {/* 内容体 */}
                        <div className="ai-body">
                            {status === 'searching' && (
                                <div className="ai-loading-container">
                                    <i className="ri-brain-line" style={{ fontSize: '4rem', marginBottom: '10px' }}></i>
                                    <p className="terminal-text">{loadingText}<span className="cursor">_</span></p>
                                </div>
                            )}

                            {status === 'complete' && (
                                <>
                                    <div className={`confidence-control ${getConfidenceClass(confidence)}`}>
                                        <div className="slider-label">
                                            <span>Semantic Match</span>
                                            <span className="score-val">{(confidence * 100).toFixed(0)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.10"
                                            max="0.99"
                                            step="0.01"
                                            value={confidence}
                                            onChange={e => setConfidence(parseFloat(e.target.value))}
                                            className="cyber-slider"
                                        />
                                    </div>

                                    <div className="ai-grid">
                                        {filteredResults.map(img => (
                                            <div
                                                key={img.id}
                                                className="ai-card"
                                                onClick={() => {
                                                    // --- 核心逻辑：区分原图与缩略图 ---

                                                    // 1. 寻找最高清的路径
                                                    // 优先级：url (原图) > filePath (原图) > thumbnail (缩略图保底)
                                                    // 注意：通常 AI 接口返回的 img 对象里，url 是原图，thumbnail 是缩略图
                                                    const originalPath = img.url || img.filePath || img.thumbnail;

                                                    // 2. 构造传给编辑器的对象
                                                    const imgForEditor = {
                                                        ...img,
                                                        // 【强制】让编辑器读取高清路径
                                                        // PhotoEditorModal 读取的是 .filePath 字段，所以我们把高清路径赋值给它
                                                        filePath: originalPath,

                                                        // 顺便更新 url 字段，以防万一
                                                        url: getFullUrl(originalPath)
                                                    };

                                                    console.log("打开编辑器，使用原图路径:", originalPath); // 方便你调试确认

                                                    // 3. 传递给 Home 打开编辑器
                                                    onImageClick(imgForEditor);
                                                }}
                                            >
                                                <div className="score-badge">{(img.score * 100).toFixed(0)}%</div>
                                                <img
                                                    src={`http://localhost:8080${img.thumbnail || img.url}`}
                                                    loading="lazy"
                                                    alt=""
                                                />
                                            </div>
                                        ))}
                                        {filteredResults.length === 0 && (
                                            <div className="empty-state">
                                                <i className="ri-database-2-line"></i>
                                                <p>无匹配数据，请尝试调整阈值或关键词</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AiSearchOverlay;