-- 1. 切换到你的数据库
USE ai_gallery;

-- 2. 修改 image_metadata 表，增加核心向量字段
-- embedding: 存储阿里云多模态模型生成的 1024 维向量
-- 使用 JSON 类型，因为向量其实就是一个巨大的浮点数数组 [0.0123, -0.4521, ...]
ALTER TABLE image_metadata 
ADD COLUMN embedding JSON COMMENT 'AI多模态向量数据(1024维)';

-- 3. (可选) 增加一个字段用于标记是否已向量化
-- 这样你的后台任务可以知道哪些图还没处理，方便做“断点续传”
ALTER TABLE image_metadata 
ADD COLUMN is_vectorized TINYINT(1) DEFAULT 0 COMMENT '是否已完成向量化: 0-否, 1-是';

-- 4. 建立索引 (针对 is_vectorized，方便快速查找未处理的图片)
CREATE INDEX idx_is_vectorized ON image_metadata(is_vectorized);