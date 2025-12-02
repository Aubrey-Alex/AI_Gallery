-- 1. 图片基本信息表
CREATE TABLE image_info (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '图片唯一标识 ID',
    user_id BIGINT NOT NULL COMMENT '关联 sys_user.id',
    file_path VARCHAR(512) NOT NULL COMMENT '原图物理路径',
    thumbnail_path VARCHAR(512) COMMENT '缩略图物理路径',
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    -- 可选：添加外键约束，确保 user_id 存在
    CONSTRAINT fk_image_user FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 图片元数据表 (与 image_info 是 1:1 关系)
CREATE TABLE image_metadata (
    image_id BIGINT PRIMARY KEY COMMENT '关联 image_info.id',
    width INT COMMENT '宽度',
    height INT COMMENT '高度',
    camera_model VARCHAR(128) COMMENT '相机型号',
    location_name VARCHAR(255) COMMENT '拍摄地点',
    shoot_time DATETIME COMMENT '拍摄时间',
    -- 外键约束：image_id 必须存在于 image_info 表中
    CONSTRAINT fk_metadata_image FOREIGN KEY (image_id) REFERENCES image_info(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;