import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
// 【关键修改】引入 EffectCreative
import { EffectCreative, Mousewheel, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-creative'; // 引入 creative 样式

import './StreamView.css';

const StreamView = ({ images, onDoubleClick }) => {
    if (!images || images.length === 0) return null;

    return (
        <div className="stream-view-container">
            <Swiper
                // 1. 开启 grabCursor，让鼠标变成“抓手”，交互感更强
                grabCursor={true}

                // 2. 居中模式
                centeredSlides={true}
                slidesPerView={'auto'}

                // 3. 循环模式 (无限滚动)
                loop={true}

                // 4. 鼠标滚轮控制
                mousewheel={{
                    sensitivity: 1.5, // 稍微灵敏一点
                    thresholdDelta: 10,
                }}

                // 5. 【核心炫技】切换为 Creative 效果
                effect={'creative'}
                creativeEffect={{
                    limitProgress: 3, // 只渲染前后 3 张，优化性能
                    prev: {
                        // 左侧图片的变换：向左移，Z轴后退，并且带一点 Y 轴旋转
                        shadow: true,
                        translate: ['-120%', 0, -500],
                        rotate: [0, 0, -10], // 微微向左倾斜
                        opacity: 0.6,
                    },
                    next: {
                        // 右侧图片的变换：向右移，Z轴后退，并且带一点 Y 轴旋转
                        shadow: true,
                        translate: ['120%', 0, -500],
                        rotate: [0, 0, 10], // 微微向右倾斜
                        opacity: 0.6,
                    },
                    // 这种配置会让中间图完全正对观众，两边的图像翅膀一样张开，非常大气
                }}

                // 6. 自动缓慢流动 (像展览馆一样) - 用户操作时会停止
                autoplay={{
                    delay: 3000,
                    disableOnInteraction: true, // 用户一摸就停
                    pauseOnMouseEnter: true,    // 鼠标放上去悬停
                }}

                speed={600} // 切换速度，慢一点显得厚重
                modules={[EffectCreative, Mousewheel, Autoplay]}
                className="mySwiper"
            >
                {images.map((img) => (
                    <SwiperSlide key={img.id} className="stream-slide">
                        <div
                            className="slide-inner"
                            onDoubleClick={() => {
                                // 这里可以加一个简单的点击反馈动画
                                console.log("Enter Immersive Mode:", img.fileName);
                                onDoubleClick(img);
                            }}
                        >
                            <img
                                src={`http://localhost:8080${img.thumbnailPath}`}
                                alt={img.fileName}
                                loading="lazy"
                            />
                            {/* 顶部的高光层，增加玻璃质感 */}
                            <div className="slide-overlay"></div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default StreamView;