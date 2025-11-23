# 📸 AI Gallery - Intelligent Asset Manager

> 《B/S体系软件设计》课程大程作业 (2025秋冬)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Docker](https://img.shields.io/badge/docker-supported-blue)

## 📖 项目介绍

**AI Gallery** 是一个基于 B/S 架构的现代化图片管理平台。针对传统本地存储检索难、管理乱的痛点，本项目利用 Web 技术实现了图片的云端存储、智能分类与多端访问。

系统不仅包含图片上传、EXIF 信息提取、在线编辑等核心功能，还创新性地引入了 **AI 计算机视觉模型** 进行自动打标，并支持 **MCP (Model Context Protocol)** 协议，允许通过大语言模型进行语义化图片检索。

---

## 📑 实验要求与任务书 (Assignment)

本项目严格按照课程实验要求开发。

👉 **[📄 点击下载/查看完整实验任务书 PDF](./assignment.pdf)**

### 核心实验要求摘要
根据 [任务书](./assignment.pdf)，本项目已实现以下功能指标：

| 类别 | 编号 | 要求描述 | 完成情况 |
| :--- | :--- | :--- | :---: |
| **基本功能** | 1 | **用户系统**：注册/登录，包含用户名/Email唯一性校验及格式验证 |  |
| | 2 | **多端上传**：支持 PC 及手机浏览器上传图片 |  |
| | 3 | **元数据提取**：自动提取并保存 EXIF 信息（时间、地点、分辨率等） |  |
| | 4 | **标签系统**：支持自动分类及用户自定义标签 |  |
| | 5 | **缩略图**：上传时自动生成缩略图，提升浏览体验 |  |
| | 6 | **数据持久化**：使用 MySQL 数据库存储图片信息 |  |
| | 7 | **查询检索**：支持多条件组合查询（时间、地点、标签） |  |
| | 8 | **展示交互**：提供网格/瀑布流布局及轮播展示 (Slideshow) |  |
| | 9 | **在线编辑**：提供图片裁剪、旋转、色调调整功能 |  |
| | 10 | **资源管理**：提供图片删除功能 |  |
| | 11 | **移动适配**：适配手机浏览器及微信内置浏览器 |  |
| **增强功能** | 12 | **AI 智能分析**：调用 AI 模型自动分析图片内容（风景/人物等） |  |
| | 13 | **MCP 接口**：支持大模型通过对话方式检索网站图片 |  |

---

## 🛠 技术栈 (Tech Stack)

本项目采用前后端分离架构开发：

- **前端 (Frontend)**:
  - React 18 + React Router v6
  - Ant Design 5.x (PC端) / Ant Design Mobile (移动端)
  - Axios (网络请求)
- **后端 (Backend)**:
  - Java Spring Boot 3.x
  - MyBatis-Plus (ORM)
  - Thumbnailator (图片处理) / Metadata-extractor (EXIF)
  - JWT (用户认证)
- **数据存储 (Database)**:
  - MySQL 8.0
- **部署运维 (DevOps)**:
  - Docker & Docker Compose
  - Nginx

---

## 📂 项目结构 (Project Structure)

```text
AI-Gallery/
├── backend/                # Spring Boot 后端源码
├── frontend/               # React 前端源码
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Welcome/    # 欢迎界面 (Landing Page)
│   │   │   ├── Login/      # 登录/注册界面
│   │   │   ├── Gallery/    # 主页面 (网格/流体视图)
│   │   │   ├── Timeline/   # 时光轴界面
│   │   │   ├── Upload/     # 智能上传界面
│   │   │   ├── Editor/     # 图片编辑与详情界面
│   │   │   └── Profile/    # 个人中心
│   │   └── components/     # 公共组件
├── docker/                 # Docker 部署配置
├── assignment(2025秋冬).pdf # 实验任务书
├── docker-compose.yml      # 容器编排文件
└── README.md               # 项目说明文档