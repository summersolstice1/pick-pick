# Summer Web App

一个面向鼠标定位训练的 Web 应用，支持账号登录、训练记录保存、成就统计和多模式训练。

## 项目简介

`Summer Web App` 最初是一个偏静态的鼠标训练 Demo，后来被重构成了完整的前后端一体化项目。  
现在它已经具备一个真正 Web 应用该有的核心能力：

- 有服务端，不再只是单页静态试玩
- 有账号系统，可以注册、登录和保存训练记录
- 有本地与云端双数据流，兼顾试玩和长期使用
- 有训练页、统计页、成就页、设置页等完整模块
- 有可继续扩展的模式系统，方便新增玩法和实验模块

如果你想找一个适合继续打磨的原生 JavaScript Web 项目，或者想把它作为作品集 / 毕设 / 练手项目的基础，这个仓库比较合适。

## 当前功能

### 账号与数据

- 用户注册 / 登录
- 获取当前用户信息
- 修改昵称
- 修改密码
- 本地试玩模式
- 登录后云端存档
- 导出 / 导入训练数据
- 重置本地数据

### 训练模式

- 点击模式 `flicking`
- 追踪模式 `tracking`
- 切换模式 `switching`
- 闪现模式 `reflex`
- 六目标模式 `sixtarget`
- DPI 测试 `dpi`

### 训练配套能力

- 实时 HUD
- 命中率 / 反应时间统计
- 成就系统
- 自定义光标
- 灵敏度换算
- 音效、粒子效果、鼠标轨迹开关

## 技术栈

### 前端

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas 2D
- Chart.js

### 后端

- Node.js
- Express
- JWT
- bcryptjs

### 存储

- 当前默认：本地 JSON 文件 `data/app-data.json`
- 未来可迁移：MySQL / PostgreSQL

## 运行方式

### 方式一：直接启动 Node 服务

```bash
npm install
npm start
```

默认访问地址：

```text
http://localhost:3000
```

### 方式二：开发模式

```bash
npm run dev
```

### 方式三：Windows 双击启动

根目录提供了两个启动脚本：

- `start.bat`
- `start.ps1`

在 Windows 下可以直接双击 `start.bat` 启动项目。

## 环境变量

项目默认读取以下环境变量：

```env
PORT=3000
JWT_SECRET=change-me-before-production
DATA_FILE=./data/app-data.json
```

可以参考根目录下的 `.env.example` 自行配置。

## 项目结构

```text
pick-pick/
├─ css/
│  └─ style.css
├─ data/
│  └─ .gitkeep
├─ deploy/
├─ js/
│  ├─ api.js
│  ├─ app.js
│  ├─ auth.js
│  ├─ audio.js
│  ├─ engine.js
│  ├─ sensitivity.js
│  ├─ stats.js
│  ├─ storage.js
│  ├─ ui.js
│  └─ modes/
│     ├─ flicking.js
│     ├─ tracking.js
│     ├─ switching.js
│     ├─ reflex.js
│     ├─ sixtarget.js
│     └─ dpi.js
├─ .env.example
├─ .gitignore
├─ database.sql
├─ index.html
├─ package.json
├─ README.md
├─ server.js
├─ start.bat
└─ start.ps1
```

## 页面说明

### 概览页

- 展示项目核心入口
- 展示最近训练记录
- 展示各模式表现摘要

### 训练页

- 选择训练模式
- 设置难度、目标大小、训练时长
- 进入实时训练

### 统计页

- 展示训练总量
- 展示平均命中率
- 展示最佳反应时间
- 展示趋势图表

### 成就页

- 展示已解锁与未解锁成就

### 设置页

- 调整训练相关设置
- 调整光标和灵敏度
- 管理账号资料
- 导入 / 导出 / 重置本地数据

## 数据流说明

项目支持两套数据流：

### 未登录时

- 训练数据保存到浏览器 `localStorage`
- 用户可以直接开始试玩

### 登录后

- 前端从服务端拉取用户存档
- 本地数据和云端数据会做接管与同步
- 后续训练结果优先写入服务端

这套设计适合“先试玩、后注册”的使用路径，也适合长期登录训练。

## API 概览

### 认证相关

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/profile`
- `POST /api/auth/change-password`

### 游戏数据相关

- `GET /api/game-data`
- `PUT /api/game-data`

### 健康检查

- `GET /api/health`

## 部署说明

项目本质上是一个 `Node.js + Express` Web 应用，不是纯静态站点。

上线时推荐这样部署：

1. 使用 `npm start`、`pm2` 或宝塔 `Node 项目管理器` 启动 `server.js`
2. 用 Nginx 或宝塔反向代理到 `127.0.0.1:3000`
3. 配置 HTTPS

不建议把它当成纯 HTML 网站直接丢到静态站点目录里运行。

## 当前存储方案说明

当前默认存储为：

```text
data/app-data.json
```

优点：

- 轻量
- 易部署
- 适合本地开发和小规模演示

限制：

- 不适合高并发
- 不适合多实例共享数据
- 不适合正式生产级持久化场景

如果准备长期上线，建议尽快迁移到 MySQL 或 PostgreSQL。

## 后续可扩展方向

- 引入排行榜系统
- 增加用户头像上传
- 增加对战 / PK 模式
- 增加多语言支持
- 增加更细的训练分析面板
- 引入数据库替代本地 JSON 存储
- 将前端拆分为组件化框架版本（如 React / Vue）

## 已知说明

- `database.sql` 目前是迁移参考，不是当前默认运行依赖
- `deploy/` 目录里有历史部署配置，可参考但不一定和当前版本完全同步
- `mysql2` 目前还保留在依赖里，但当前默认运行并不依赖 MySQL

## 参考与致谢

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Chart.js](https://www.chartjs.org/)
- 训练模式参考项目：[trainGun](https://github.com/lby-1/trainGun)
- DPI 测试思路参考：`Speed-Accuracy-Test-master`

## 贡献

欢迎提 Issue 或 Pull Request。

如果你准备继续开发，比较建议优先处理下面几件事：

- 把存储层进一步抽象
- 为 API 增加更严格的参数校验
- 增加自动化测试
- 拆分和整理模式系统

---

如果这个项目对你有帮助，欢迎点一个 `Star`。
