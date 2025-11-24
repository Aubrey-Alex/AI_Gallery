-- 1. 创建一个专用用户 (用户名: ai_admin, 密码: 123456)
-- 如果提示用户已存在，可以忽略或换个名字
CREATE USER 'ai_admin' @'localhost' IDENTIFIED BY '123456';

-- 2. 确保 ai_gallery 数据库存在
CREATE DATABASE IF NOT EXISTS ai_gallery;

-- 3. 把 ai_gallery 数据库的所有权限都给这个新用户
GRANT ALL PRIVILEGES ON ai_gallery.* TO 'ai_admin' @'localhost';

-- 4. 刷新权限，立即生效
FLUSH PRIVILEGES;