import React, { useState, useMemo, useRef, useEffect } from 'react';
import './PhotoEditorModal.css';
import { message } from 'antd';
// 引入 Cropper
import Cropper from 'react-cropper';
// import 'cropperjs/dist/cropper.css';

const PhotoEditorModal = ({ isOpen, onClose, imageObj, onSave }) => {
    // 从 imageObj 中提取 src
    const imageSrc = imageObj ? `http://localhost:8080${imageObj.filePath}` : '';
    // 提取 metadata (防止为空)
    const meta = imageObj?.metadata || {};

    console.log('ImageSrc:', imageSrc);
    const [activeGroup, setActiveGroup] = useState('light');
    const cropperRef = useRef(null); // 引用 Cropper 实例
    // 【新增】用来记录图片刚加载时的初始缩放值
    const baseZoom = useRef(0);

    // 核心编辑状态
    // 【修复】在这里定义初始状态常量
    const INITIAL_STATE = {
        exposure: 0, contrast: 0, highlights: 0, shadows: 0,
        temp: 0, tint: 0, vibrance: 0, saturation: 0,
        texture: 0, clarity: 0, dehaze: 0,
        rotate: 0
    };

    // 核心编辑状态
    const [editState, setEditState] = useState(INITIAL_STATE); // 使用常量初始化

    // 【核心修复】监听 isOpen 变化，每次打开时重置所有状态
    useEffect(() => {
        if (isOpen) {
            // 重置 React 状态
            setEditState(INITIAL_STATE);
            // 重置基准缩放
            baseZoom.current = 0;
            // 重置菜单折叠
            setActiveGroup('light');

            // 重置 Cropper (如果有残留实例)
            if (cropperRef.current && cropperRef.current.cropper) {
                cropperRef.current.cropper.reset();
            }
        }
    }, [isOpen]); // 依赖 isOpen，每次打开都会触发

    // 【核心修改】更新状态函数
    const updateState = (key, value) => {
        const val = parseFloat(value);
        setEditState(prev => ({ ...prev, [key]: val }));

        // 特殊处理旋转：实现“边旋转边自动缩放”
        if (key === 'rotate' && cropperRef.current) {
            const cropper = cropperRef.current.cropper;

            // 1. 执行旋转
            cropper.rotateTo(val);

            // 2. 计算自动缩放比例 (关键算法)
            // 目的：旋转后放大图片，确保裁剪框内没有黑边
            const radians = (val * Math.PI) / 180; // 转弧度
            // 缩放系数 = |cosθ| + |sinθ|
            // 这个公式能保证正方形区域旋转时始终填满
            const zoomFactor = Math.abs(Math.cos(radians)) + Math.abs(Math.sin(radians));

            // 3. 应用缩放 (基于初始缩放值 baseZoom)
            if (baseZoom.current > 0) {
                cropper.zoomTo(baseZoom.current * zoomFactor);
            }
        }
    };

    // 重置
    const handleReset = () => {
        setEditState({
            exposure: 0, contrast: 0, highlights: 0, shadows: 0,
            temp: 0, tint: 0, vibrance: 0, saturation: 0,
            texture: 0, clarity: 0, dehaze: 0,
            rotate: 0
        });
        if (cropperRef.current) {
            const cropper = cropperRef.current.cropper;
            cropper.reset();
            // 重置时，把旋转和缩放都恢复到初始状态
            cropper.rotateTo(0);
            if (baseZoom.current > 0) {
                cropper.zoomTo(baseZoom.current);
            }
        }
        message.info('已重置所有参数');
    };

    // --- 生成 CSS 滤镜字符串 (用于预览和最终保存) ---
    const getFilterString = () => {
        const {
            exposure, contrast, highlights, shadows,
            temp, tint, vibrance, saturation,
            clarity, dehaze
        } = editState;

        let b = 100 + exposure + (highlights * -0.3) + (shadows * 0.3) + (dehaze * -0.2);
        let c = 100 + contrast + (clarity * 0.5) + (dehaze * 0.5);
        let s = 100 + saturation + (vibrance * 0.5) + (dehaze * 0.3);
        let sepia = temp > 0 ? temp * 0.4 : 0;
        let hue = tint + (temp < 0 ? temp * 0.2 : 0);
        let gray = clarity > 0 ? clarity * 0.1 : 0;

        let filters = [
            `brightness(${b}%)`,
            `contrast(${c}%)`,
            `saturate(${s}%)`,
            `sepia(${sepia}%)`,
            `hue-rotate(${hue}deg)`,
            `grayscale(${gray}%)`
        ];

        // 注意：这里不加 SVG url(#sharpen)，因为 Canvas API 不支持直接画 SVG Filter
        // 如果要做 SVG 锐化，需要极其复杂的像素处理，为了大程稳定性，这里只做 CSS 模拟

        return filters.join(' ');
    };

    // --- 核心：保存逻辑 (合并裁剪 + 滤镜) ---
    const handleSaveProcess = () => {
        if (!cropperRef.current) return;

        const hideLoading = message.loading('正在处理图片...', 0);
        const cropper = cropperRef.current.cropper;

        // 1. 获取裁剪后的 Canvas (已经包含了旋转和裁剪)
        const croppedCanvas = cropper.getCroppedCanvas({
            imageSmoothingQuality: 'high',
        });

        if (!croppedCanvas) {
            hideLoading();
            message.error('无法获取裁剪图片');
            return;
        }

        // 2. 创建一个新的 Canvas 来应用滤镜
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = croppedCanvas.width;
        finalCanvas.height = croppedCanvas.height;
        const ctx = finalCanvas.getContext('2d');

        // 3. 应用滤镜 (这一步是核心，把 CSS Filter 变成永久像素)
        ctx.filter = getFilterString();

        // 4. 将裁剪好的图画上去
        ctx.drawImage(croppedCanvas, 0, 0);

        // 5. 导出为 Base64
        const base64Url = finalCanvas.toDataURL('image/jpeg', 0.9); // 0.9 质量

        hideLoading();
        onSave(base64Url); // 回调给父组件
    };

    if (!isOpen) return null;

    return (
        <div className={`editor-overlay ${isOpen ? 'active' : ''}`}>
            <button className="editor-close-btn" onClick={onClose}>
                <i className="ri-close-line"></i>
            </button>

            <div className="editor-container">
                {/* 图片预览区 (改为 Cropper) */}
                <div className="preview-area">
                    <Cropper
                        src={imageSrc}
                        style={{
                            height: '100%',
                            width: '100%',
                            filter: getFilterString()
                        }}
                        // --- 核心修复配置 ---
                        initialAspectRatio={NaN}
                        aspectRatio={NaN}
                        guides={false}        // 关掉虚线网格，看起来更像预览
                        viewMode={1}          // 限制图片不能拖出画布
                        dragMode="move"       // 默认是拖拽图片移动
                        responsive={true}
                        checkOrientation={false}

                        // 【修复变暗】关掉黑色遮罩，让图片保持原亮
                        modal={false}
                        background={false}    // 关掉透明格子背景

                        // 【修复布局】默认选中整个图片区域
                        autoCropArea={1}

                        ref={cropperRef}

                        // 【核心修改】初始化完成后，记录“基准缩放值”
                        ready={(e) => {
                            if (e.target && e.target.cropper) {
                                // 获取当前自动适应屏幕后的 zoom 数据
                                const initialData = e.target.cropper.getCanvasData();
                                // 计算当前的 zoom (width / naturalWidth)
                                const imgData = e.target.cropper.getImageData();
                                // 记录这个基准值，后续旋转缩放都基于这个值
                                baseZoom.current = imgData.width / imgData.naturalWidth;
                            }
                        }}
                    />
                </div>

                {/* 工具面板 (保持不变，只改了 Geometry 部分的逻辑) */}
                <div className="tools-panel">
                    <div className="panel-header">
                        <h2><i className="ri-equalizer-line"></i> 图片工坊</h2>
                    </div>

                    {/* Group 1: Light */}
                    <div className="tool-group">
                        <div className="group-header" onClick={() => setActiveGroup(activeGroup === 'light' ? '' : 'light')}>
                            <span>光效 (Light)</span>
                            <i className="ri-arrow-down-s-line"></i>
                        </div>
                        <div className={`group-content ${activeGroup === 'light' ? 'show' : ''}`}>
                            <Slider label="曝光 (Exposure)" value={editState.exposure} onChange={v => updateState('exposure', v)} />
                            <Slider label="对比度 (Contrast)" value={editState.contrast} onChange={v => updateState('contrast', v)} />
                            <Slider label="高光 (Highlights)" value={editState.highlights} onChange={v => updateState('highlights', v)} />
                            <Slider label="阴影 (Shadows)" value={editState.shadows} onChange={v => updateState('shadows', v)} />
                        </div>
                    </div>

                    {/* Group 2: Color */}
                    <div className="tool-group">
                        <div className="group-header" onClick={() => setActiveGroup(activeGroup === 'color' ? '' : 'color')}>
                            <span>色彩 (Color)</span>
                            <i className="ri-arrow-down-s-line"></i>
                        </div>
                        <div className={`group-content ${activeGroup === 'color' ? 'show' : ''}`}>
                            <Slider label="色温 (Temp)" value={editState.temp} min={-100} max={100} onChange={v => updateState('temp', v)} />
                            <Slider label="色调 (Tint)" value={editState.tint} min={-100} max={100} onChange={v => updateState('tint', v)} />
                            <Slider label="鲜艳度 (Vibrance)" value={editState.vibrance} onChange={v => updateState('vibrance', v)} />
                            <Slider label="饱和度 (Saturation)" value={editState.saturation} onChange={v => updateState('saturation', v)} />
                        </div>
                    </div>

                    {/* Group 3: Effects */}
                    <div className="tool-group">
                        <div className="group-header" onClick={() => setActiveGroup(activeGroup === 'effects' ? '' : 'effects')}>
                            <span>效果 (Effects)</span>
                            <i className="ri-arrow-down-s-line"></i>
                        </div>
                        <div className={`group-content ${activeGroup === 'effects' ? 'show' : ''}`}>
                            <Slider label="清晰度 (Clarity)" value={editState.clarity} onChange={v => updateState('clarity', v)} />
                            <Slider label="去朦胧 (Dehaze)" value={editState.dehaze} onChange={v => updateState('dehaze', v)} />
                        </div>
                    </div>

                    {/* Group 4: Geometry & Crop */}
                    <div className="tool-group">
                        <div className="group-header" onClick={() => setActiveGroup(activeGroup === 'geo' ? '' : 'geo')}>
                            <span>裁剪与旋转 (Crop)</span>
                            <i className="ri-arrow-down-s-line"></i>
                        </div>
                        <div className={`group-content ${activeGroup === 'geo' ? 'show' : ''}`}>
                            {/* 调用 Cropper 自带的旋转 */}
                            <Slider label="旋转 (Rotate)" value={editState.rotate} min={0} max={360} step={0.5} onChange={v => updateState('rotate', v)} />

                            <div style={{ marginTop: '10px', color: '#666', fontSize: '0.8rem' }}>
                                * 旋转时系统会自动放大图片以填满画布
                            </div>
                        </div>
                    </div>

                    {/* --- 【新增】Group 5: 元数据展示 (只读) --- */}
                    <div className="tool-group">
                        <div className="group-header" onClick={() => setActiveGroup(activeGroup === 'info' ? '' : 'info')}>
                            <span>元数据 (Info)</span>
                            <i className="ri-arrow-down-s-line"></i>
                        </div>
                        <div className={`group-content ${activeGroup === 'info' ? 'show' : ''}`}>
                            <div className="info-row">
                                <label>相机:</label>
                                <span>{meta.cameraModel || '未知设备'}</span>
                            </div>
                            <div className="info-row">
                                <label>尺寸:</label>
                                <span>{meta.width ? `${meta.width} x ${meta.height}` : '未知'}</span>
                            </div>
                            <div className="info-row">
                                <label>时间:</label>
                                {/* 简单的格式化时间 */}
                                <span>{meta.shootTime ? new Date(meta.shootTime).toLocaleString() : '未知'}</span>
                            </div>
                            <div className="info-row">
                                <label>地点:</label>
                                <span>{meta.locationName || '未记录'}</span>
                            </div>
                            <div className="info-row">
                                <label>文件:</label>
                                {/* 从 filePath 截取文件名 */}
                                <span style={{ wordBreak: 'break-all' }}>{imageObj?.fileName || 'unknown.jpg'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="panel-footer">
                        <button className="btn btn-secondary" onClick={handleReset}>
                            <i className="ri-refresh-line"></i> 重置
                        </button>
                        <button className="btn btn-primary" onClick={handleSaveProcess}>
                            <i className="ri-save-3-line"></i> 保存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Slider = ({ label, value, min = -100, max = 100, step = 1, onChange }) => (
    <div className="slider-control">
        <div className="slider-header">
            <span>{label}</span>
            <span className="slider-val">{value}</span>
        </div>
        <input
            type="range"
            className="custom-range"
            min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

export default PhotoEditorModal;