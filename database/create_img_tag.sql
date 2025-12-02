-- 1. 标签字典表
CREATE TABLE image_tag (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '标签 ID',
    tag_name VARCHAR(64) NOT NULL COMMENT '标签名称',
    tag_type INT DEFAULT 1 COMMENT '标签类型: 1-人工, 2-AI',
    UNIQUE KEY uk_tag_name (tag_name) -- 保证标签名不重复
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 图片-标签关联表
CREATE TABLE image_tag_relation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '关联 ID',
    image_id BIGINT NOT NULL COMMENT '图片 ID',
    tag_id BIGINT NOT NULL COMMENT '标签 ID',
    -- 防止同一张图重复打同一个标签
    UNIQUE KEY uk_img_tag (image_id, tag_id),
    -- 外键约束 (可选，建议加上以保证数据完整性)
    CONSTRAINT fk_relation_image FOREIGN KEY (image_id) REFERENCES image_info(id) ON DELETE CASCADE,
    CONSTRAINT fk_relation_tag FOREIGN KEY (tag_id) REFERENCES image_tag(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;