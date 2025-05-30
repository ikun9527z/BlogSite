# 个人博客系统

一个简单但功能完整的个人博客系统，支持文章管理、实时更新和响应式设计。

## 功能特点

- 💡 文章的增删改查
- 🔍 支持按标题、内容和分类搜索
- 📱 响应式设计，支持移动端
- 🖼️ 支持图片上传和预览
- 🔄 WebSocket实时更新
- 📅 文章时间轴展示
- 🔐 基础用户认证系统

## 技术栈

- 前端：原生JavaScript、CSS3
- 后端：Node.js、Express.js
- 数据库：SQLite3
- 实时通信：WebSocket
- 文件上传：Multer

## 快速开始

1. 安装依赖
```bash
npm install
```

2. 启动服务器
```bash
npm start
```

3. 访问网站
- 本地访问：http://localhost:3000
- 局域网访问：http://{your-ip-address}:3000

## 默认账号

- 用户名：admin
- 密码：123456

## 目录结构
```
personalwebsite/
├── public/                 # 静态资源文件
│   ├── css/               # 样式文件
│   ├── js/                # 客户端脚本
│   └── uploads/           # 上传的图片
├── routes/                # 路由文件
│   ├── admin.js          # 管理后台路由
│   ├── api.js            # API 接口路由
│   └── index.js          # 前台页面路由
├── views/                 # 视图模板
│   ├── admin/            # 管理后台页面
│   └── front/            # 前台页面
├── models/               # 数据模型
│   ├── article.js       # 文章模型
│   └── user.js          # 用户模型
├── middleware/          # 中间件
│   ├── auth.js         # 认证中间件
│   └── upload.js       # 文件上传中间件
├── utils/              # 工具函数
├── config.js           # 配置文件
├── app.js             # 应用入口文件
├── package.json       # 项目依赖
└── README.md          # 项目说明
```
  <em>演示</em>
  ![Raw GitHub Image](https://raw.githubusercontent.com/ikun9527z/BlogSite/master/Demo.png)

