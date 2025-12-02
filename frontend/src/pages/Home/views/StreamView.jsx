import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCreative, Mousewheel, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-creative';
// 某些版本的 Swiper 可能需要显式引入 pagination 或 autoplay 的 css，但这通常不是必须的
// import 'swiper/css/autoplay'; 

import './StreamView.css';

const StreamView = ({ images, onDoubleClick }) => {
    if (!images || images.length === 0) return null;

    return (
        <div className="stream-view-container">
            <Swiper
                // 【修改 1】增加 key，确保数据变化（如从0变成10张图）时，Swiper 能够完全重置并重新计算 loop
                key={images.length}

                grabCursor={true}
                centeredSlides={true}
                slidesPerView={'auto'}
                loop={true}

                // 【修改 2】修正鼠标滚轮配置
                mousewheel={{
                    sensitivity: 10,
                    thresholdDelta: 10,
                    // forceToAxis: true, // 删除或改为 false，否则垂直滚轮无法控制水平滑块
                    forceToAxis: false,
                }}

                effect={'creative'}
                creativeEffect={{
                    limitProgress: 3,
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

                // 【修改 3】修正自动播放配置
                autoplay={{
                    delay: 500,
                    // 改为 false，这样用户操作完后，过一会儿还会继续自动播，体验更好
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                }}

                speed={1000}
                modules={[EffectCreative, Mousewheel, Autoplay]}
                className="mySwiper"
            >
                {images.map((img) => (
                    <SwiperSlide key={img.id} className="stream-slide">
                        <div
                            className="slide-inner"
                            onDoubleClick={() => {
                                console.log("Enter Immersive Mode:", img.fileName);
                                onDoubleClick(img);
                            }}
                        >
                            <img
                                src={`http://localhost:8080${img.thumbnailPath}`}
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