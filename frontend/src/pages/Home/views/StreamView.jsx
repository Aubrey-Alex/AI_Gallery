// src/pages/Home/views/StreamView.jsx

import React, { useMemo, useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCreative, Mousewheel, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-creative';
import './StreamView.css';

const StreamView = ({ images, selectedIds = [], onDoubleClick }) => {

    // 【补全这里！！！】你之前漏掉了这几行代码，导致 isMobile 未定义
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 【核心修改步骤 1】先计算出“原始”的图片列表（不包含为了轮播而复制的）
    // 这个列表用于计算准确的数量
    const rawDisplayImages = useMemo(() => {
        if (selectedIds && selectedIds.length > 0) {
            return images.filter(img => selectedIds.includes(img.id));
        }
        return images; // 如果没选中，原始列表就是所有图片
    }, [images, selectedIds]);

    // 【核心修改步骤 2】基于 rawDisplayImages 生成 Swiper 真正需要的渲染列表（包含复制的）
    const swiperSlides = useMemo(() => {
        if (!rawDisplayImages || rawDisplayImages.length === 0) return [];

        let result = [...rawDisplayImages];

        // 使用 while 循环，只要数量不够 14 张，就一直翻倍复制
        // 比如：1张 -> 2 -> 4 -> 8 -> 16 (停止)
        // 比如：3张 -> 6 -> 12 -> 24 (停止)
        while (result.length < 14) {
            result = [...result, ...result];
        }

        return result;
    }, [rawDisplayImages]);

    // 如果没有图片，不渲染
    if (!rawDisplayImages || rawDisplayImages.length === 0) return null;

    const isFilteredMode = selectedIds.length > 0;

    return (
        <div className="stream-view-container">
            {isFilteredMode && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 100,
                    color: 'rgba(255,255,255,0.7)',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    pointerEvents: 'none'
                }}>
                    {/* 【核心修改步骤 3】这里显示 rawDisplayImages.length (真实数量) */}
                    正在轮播选中的 {rawDisplayImages.length} 张照片
                </div>
            )}

            <Swiper
                // Key 使用真实数量和模式，保证切换时重置
                key={`${rawDisplayImages.length}-${isFilteredMode ? 'filtered' : 'all'}`}

                // 【关键修复 1】强制开启进度监听，这对 3D 堆叠效果至关重要
                watchSlidesProgress={true}

                // 【关键修复 2】核心中的核心！
                // 告诉 Swiper 为了 Loop 效果，必须在首尾额外复制多少张图的 DOM。
                // 这个值必须 >= limitProgress。如果没设这个，limitProgress 再大也没用。
                loopedSlides={6}

                grabCursor={true}
                centeredSlides={true}
                slidesPerView={'auto'}
                loop={true}
                mousewheel={{
                    sensitivity: 5,
                    thresholdDelta: 10,
                    forceToAxis: false,
                }}
                effect={'creative'}
                creativeEffect={{
                    limitProgress: 6,
                    prev: {
                        shadow: true,
                        translate: ['-120%', 0, -500],
                        rotate: [0, 0, -10],
                        opacity: 0.6,
                    },
                    next: {
                        shadow: true,
                        translate: ['120%', 0, -500],
                        rotate: [0, 0, 10],
                        opacity: 0.6,
                    },
                }}
                autoplay={{
                    delay: 1200,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                }}
                speed={800}
                modules={[EffectCreative, Mousewheel, Autoplay]}
                className="mySwiper"
            >
                {/* 【核心修改步骤 4】这里遍历 swiperSlides (填充后的列表) */}
                {/* ⚠️注意：因为有重复图片，key 不能只用 img.id，必须加上 index 否则 React 会报错 */}
                {swiperSlides.map((img, index) => (
                    <SwiperSlide key={`${img.id}-duplicate-${index}`} className="stream-slide">
                        <div
                            className="slide-inner"
                            onDoubleClick={() => {
                                // 只有 "不是手机" 时，才允许打开大图
                                if (!isMobile) {
                                    onDoubleClick(img);
                                }
                            }}
                        >
                            <img
                                src={`${import.meta.env.VITE_IMG_BASE_URL}${img.thumbnailPath}`}
                                alt={img.fileName}
                                loading="lazy"
                            />
                            <div className="slide-overlay"></div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default StreamView;