# frontend/Dockerfile

# 第一阶段：构建

# 使用 Node 镜像来编译 React 代码
FROM node:18 AS build-stage
WORKDIR /app

# 先拷 package.json 安装依赖，利用缓存
COPY package*.json ./
RUN npm install

# 拷所有代码并编译
COPY . .
RUN npm run build

# 第二阶段：生产环境

# 使用 Nginx 镜像来运行
FROM nginx:stable-alpine

# 1. 把第一阶段编译好的 dist 文件夹拷到 Nginx 的默认目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 2. 把 nginx.conf 拷进去，替换默认配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]