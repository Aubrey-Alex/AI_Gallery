ALTER TABLE image_info 
ADD COLUMN is_favorite TINYINT(1) DEFAULT 0 COMMENT '是否收藏: 0-否, 1-是';