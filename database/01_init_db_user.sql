-- 1. 创建数据库 (如果不存在的话)
CREATE DATABASE IF NOT EXISTS ai_gallery DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 2. 选中这个数据库
USE ai_gallery;

-- 3. 创建用户表 (sys_user)
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    username VARCHAR(64) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(128) NOT NULL COMMENT '密码',
    email VARCHAR(128) COMMENT '邮箱',
    role VARCHAR(20) DEFAULT 'USER' COMMENT '角色(USER/ADMIN)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) COMMENT '用户信息表';

-- 4. 插入一条测试数据 (账号: admin, 密码: 123456)
INSERT INTO sys_user (username, password, email, role) 
VALUES ('admin', '123456', 'admin@example.com', 'ADMIN');