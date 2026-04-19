# Summer Web App

> 一个真正可登录、可保存、可继续扩展的 Web 端鼠标定位训练项目。

[![Node.js](https://img.shields.io/badge/Node.js-Express-111827?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20JS-F59E0B?style=flat-square)](#技术栈)
[![Storage](https://img.shields.io/badge/Storage-Local%20JSON-0EA5E9?style=flat-square)](#数据存储说明)
[![Status](https://img.shields.io/badge/Status-Playable-10B981?style=flat-square)](#核心能力)

## 项目简介

`Summer Web App` 是一个以鼠标精度训练为核心的 Web 应用。  
这个项目最初是一个偏静态页面的训练 Demo，现在已经重构成了完整的前后端一体化应用：

- 有真正的服务端，而不只是静态页面
- 有账号系统，而不只是本地试玩
- 有云端存档，而不只是浏览器 `localStorage`
- 有完整的页面壳层、设置面板、统计面板和成就系统
- 训练玩法仍基于 `Canvas`，保留了较轻量、响应快的体验

如果你想找一个适合继续扩展的原生 JavaScript Web 游戏项目，或者想拿它作为自己的练手项目、毕业设计、简历项目基础，这个仓库是一个不错的起点。

## 核心能力

- 账号系统
  - 用户注册
  - 用户登录
  - 获取当前登录用户
  - 修改昵称
  - 修改密码
- 训练模式
  - 点击模式 `flicking`
  - 追踪模式 `tracking`
  - 切换模式 `switching`
  - 闪现模式 `reflex`
  - 六目标模式 `sixtarget`
- 数据能力
  - 访客模式本地游玩
  - 登录后云端存档
  - 本地数据导出 / 导入
  - 本地数据重置
  - 训练记录自动统计
  - 成就自动解锁
- 个性化能力
  - HUD 开关
  - 鼠标轨迹
  - 粒子效果
  - 音效开关
  - 自定义光标样式
  - 灵敏度换算
- 工程能力
  - `Express` 提供页面和 API
  - JWT 登录态
  - 本地 JSON 持久化
  - 项目结构清晰，方便继续拆分重构

## 在线体验

如果你已经部署了项目，可以把地址补在这里：

```text
Demo: https://your-demo-url.example.com
```

如果暂时还没部署，也可以先删除这一节，或者保留为待补充。

## 界面预览

你可以在后续补上截图，例如：

```md
![home](./docs/home.png)
![training](./docs/training.png)
![stats](./docs/stats.png)
```

建议至少准备 3 张图：

- 首页概览
- 训练场景
- 统计 / 成就页面

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

### 数据存储

- 当前默认：本地 JSON 文件 `data/app-data.json`
- 兼容思路：未来可迁移到 MySQL / PostgreSQL / MongoDB

## 项目结构

```text
pick-pick/
├─ css/
│  └─ style.css                 # 页面样式
├─ data/
│  └─ .gitkeep                  # 本地数据目录（运行后会生成 app-data.json）
├─ deploy/                      # 旧部署配置与扩展参考
├─ js/
│  ├─ api.js                    # 前端 API 请求封装
│  ├─ app.js                    # 应用入口
│  ├─ auth.js                   # 登录态管理
│  ├─ audio.js                  # 音效管理
│  ├─ engine.js                 # 游戏引擎核心
│  ├─ sensitivity.js            # 灵敏度换算
│  ├─ stats.js                  # 统计面板逻辑
│  ├─ storage.js                # 本地存储封装
│  ├─ ui.js                     # UI 交互与页面逻辑
│  └─ modes/                    # 各训练模式实现
├─ .env.example                 # 环境变量示例
├─ .gitignore
├─ database.sql                 # 后续迁移到关系型数据库时的结构参考
├─ index.html                   # 前端页面入口
├─ package.json
├─ README.md
└─ server.js                    # Express 服务入口
```

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-name/pick-pick.git
cd pick-pick
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制环境变量模板：

```bash
copy .env.example .env
```

`.env.example` 内容如下：

```env
PORT=3000
JWT_SECRET=change-me-before-production
DATA_FILE=./data/app-data.json
```

如果你在 macOS / Linux 下，可以改用：

```bash
cp .env.example .env
```

### 4. 启动项目

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm start
```

### 5. 访问项目

在浏览器中打开：

```text
http://localhost:3000
```

## 运行逻辑说明

项目现在是“前后端同源”模式：

- `server.js` 启动 Express 服务
- Express 负责托管静态资源和 API
- 前端页面直接请求同域 `/api/*`
- 数据默认保存在服务端本地 JSON 文件里

这意味着它已经是一个真正可部署的 Web 项目，而不是只能双击 `index.html` 的静态 Demo。

## 数据存储说明

当前版本默认使用：

```text
data/app-data.json
```

它会在服务第一次启动时自动创建。

### 存储内容

- 用户账号信息
- 用户训练统计
- 用户成就信息
- 用户设置
- 用户灵敏度配置

### 当前方案适合什么场景

适合：

- 本地开发
- Demo 演示
- 小规模体验站
- 课程项目 / 作品集项目

不太适合：

- 高并发生产环境
- 多实例横向扩容
- 对数据一致性要求很高的正式商业场景

如果你准备上线到更正式的环境，建议把这一层迁移到 MySQL 或 PostgreSQL。

## API 一览

### 认证相关

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/profile`
- `POST /api/auth/change-password`

### 数据相关

- `GET /api/game-data`
- `PUT /api/game-data`

### 健康检查

- `GET /api/health`

## 页面说明

### 1. 概览页

- 展示核心介绍
- 展示最近训练记录
- 展示模式表现
- 展示关键统计指标

### 2. 训练页

- 选择训练模式
- 设置难度、目标大小、训练时长
- 进入训练并实时显示 HUD

### 3. 统计页

- 显示总训练局数、总命中、平均命中率、最佳反应
- 使用图表展示趋势变化

### 4. 成就页

- 展示当前已解锁和未解锁成就

### 5. 设置页

- 训练设置
- 光标设置
- 灵敏度设置
- 账号资料设置
- 导入 / 导出 / 重置数据

## 登录与数据同步机制

为了兼顾试玩体验和账号保存，项目采用了两套数据流：

### 未登录时

- 数据保存在浏览器 `localStorage`
- 用户可以直接开始训练

### 登录后

- 前端会读取服务端账号数据
- 如果本地已有试玩数据，系统会尝试做一次同步接管
- 后续训练数据会优先写入服务端

这个机制让项目既适合“先试玩再注册”，也适合“长期登录使用”。

## 部署建议

### 适合的部署方式

- 一台普通 Node.js 服务器
- 云服务器 / 轻量应用服务器
- Docker 容器
- 后续接数据库后再上更正式的 PaaS

### 上线前建议至少处理的事项

- 修改 `JWT_SECRET`
- 不要把真实 `.env` 提交到 GitHub
- 为服务加反向代理（如 Nginx）
- 配置 HTTPS
- 如果有正式用户数据，尽快迁移到数据库

## GitHub 展示建议

如果你准备把它作为 GitHub 项目首页展示，我建议你再补 3 样东西：

### 1. 补截图

把项目运行后的页面截图放到 `docs/` 目录，然后在 README 顶部展示。

### 2. 补 Demo 地址

如果你部署了线上版本，把地址放在“在线体验”部分。

### 3. 补项目背景

你可以在 README 里额外加一小段：

- 为什么做这个项目
- 你在里面负责什么
- 项目最难的点是什么

这对 GitHub 展示和面试都很有帮助。

## 后续可扩展方向

- 接入 MySQL / PostgreSQL
- 增加排行榜系统
- 增加邮箱注册 / 找回密码
- 增加管理员后台
- 增加更多训练模式
- 增加多语言支持
- 增加用户头像上传
- 增加对战 / PK 模式
- 增加移动端适配优化
- 将前端拆分为组件化框架版本（React / Vue）

## 已知说明

- 当前存储层使用 JSON 文件，适合轻量部署
- `deploy/` 目录中有一些历史部署配置，可作为参考，但不一定完全与当前版本同步
- `database.sql` 是迁移参考，不是当前默认运行依赖

## 贡献

欢迎提 Issue 或 Pull Request。

如果你准备继续开发，比较推荐从下面几个方向入手：

- 把存储层抽象成独立模块
- 为 API 增加参数校验
- 加入单元测试 / 接口测试
- 为训练模式补更多统计维度

## 致谢

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Chart.js](https://www.chartjs.org/)

---

如果这个项目对你有帮助，欢迎点一个 `Star`。
