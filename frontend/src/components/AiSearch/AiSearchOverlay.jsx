// src/components/AiSearch/AiSearchOverlay.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from '../../utils/request';
import './AiSearchOverlay.css';

const AiSearchOverlay = ({ onImageClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('idle');
    const [loadingText, setLoadingText] = useState('');
    const [results, setResults] = useState([]);
    const [confidence, setConfidence] = useState(0.65);
    const inputRef = useRef(null);

    // 定义文案数组
    const LOADING_MESSAGES = [
        "正在解析自然语言指令...",
        "提取语义特征向量...",
        "扫描神经网络节点...",
        "计算多维空间距离...",
        "正在建立神经连接...",
        "过滤低置信度数据...",
        "正在渲染全息投影..."
    ];
    // 定义每句话的停留时间
    const MSG_INTERVAL = 300;

    useEffect(() => {
        if (isOpen && inputRef.current) inputRef.current.focus();
    }, [isOpen]);

    // 动画定时器逻辑
    useEffect(() => {
        let interval;
        if (status === 'searching') {
            let i = 0;
            setLoadingText(LOADING_MESSAGES[0]);

            interval = setInterval(() => {
                i++;
                // 如果播放完了最后一句，就停在最后一句，不要重头循环
                if (i < LOADING_MESSAGES.length) {
                    setLoadingText(LOADING_MESSAGES[i]);
                }
            }, MSG_INTERVAL);
        }
        return () => clearInterval(interval);
    }, [status]);

    // 打开/关闭搜索框
    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setStatus('idle');
            setQuery('');
            setResults([]);
        }
    };

    // 获取完整 URL
    const getFullUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${path}`;
    };

    // 搜索
    const handleSearch = async (e) => {
        if (e.key === 'Enter' && query.trim()) {
            setStatus('searching');

            try {
                const minAnimationTime = LOADING_MESSAGES.length * MSG_INTERVAL;

                // 使用 Promise.all 并行执行：
                // 1. 发送真实请求
                // 2. 等待动画播放完毕
                // 只有两者都完成了，才会继续往下走
                const [res, _] = await Promise.all([
                    axios.post('/api/mcp/search', { query }),
                    new Promise(resolve => setTimeout(resolve, minAnimationTime))
                ]);

                if (res.data && res.data.code === 200) {
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

    // 获取置信度类名
    const getConfidenceClass = (conf) => {
        if (conf >= 0.80) return 'high-precision';
        if (conf <= 0.40) return 'low-inspiration';
        return '';
    };

    // 过滤置信度
    const filteredResults = results.filter(item => item.score >= confidence);

    return (
        <>
            {/* 悬浮按钮 */}
            <div className={`ai-fab ${isOpen ? 'hidden' : ''}`} onClick={toggleOpen}>
                <div className="ai-fab-ring"></div>
                <i className="ri-brain-line"></i>
            </div>

            {/* 搜索框 */}
            {isOpen && (
                <div className="ai-overlay">
                    <div className="ai-backdrop" onClick={toggleOpen}></div>
                    <div className="ai-content">
                        {/* 头部 */}
                        <div className="ai-header">
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
                            <button className="ai-close-main" onClick={toggleOpen}>
                                <i className="ri-close-line"></i>
                            </button>
                        </div>

                        {/* 内容体 */}
                        <div className="ai-body">
                            {status === 'searching' && (
                                <div className="ai-loading-container">
                                    <i className="ri-brain-line" style={{ fontSize: '4rem', marginBottom: '10px' }}></i>
                                    <p className="terminal-text">{loadingText}</p>
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

                                    {/* 展示图片 */}
                                    <div className="ai-grid">
                                        {filteredResults.map(img => (
                                            <div
                                                key={img.id}
                                                className="ai-card"
                                                onClick={() => {
                                                    const originalPath = img.url || img.filePath || img.thumbnail;
                                                    const imgForEditor = {
                                                        ...img,
                                                        filePath: originalPath,
                                                        url: getFullUrl(originalPath)
                                                    };
                                                    onImageClick(imgForEditor);
                                                }}
                                            >
                                                <div className="score-badge">{(img.score * 100).toFixed(0)}%</div>
                                                <img
                                                    src={img.thumbnail || img.url}
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