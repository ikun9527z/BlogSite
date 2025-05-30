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
e:\game\Personalwebsite\<br>
├── article.html      # 文章详情页<br>
├── index.html        # 主页<br>
├── package.json      # 项目配置<br>
├── README.md         # 项目说明<br>
├── database.sqlite   # SQLite数据库<br>
├── css\<br>
│   └── style.css    # 样式文件<br>
├── js\<br>
│   ├── config.js    # 配置文件<br>
│   ├── db.js        # 数据库操作<br>
│   └── main.js      # 主要逻辑<br>
└── server\<br>
    └── server.js    # Express服务器<br>
  <em>演示</em>
  ![Raw GitHub Image](https://raw.githubusercontent.com/ikun9527z/BlogSite/master/Demo.png)

