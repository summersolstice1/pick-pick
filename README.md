# Summer Web App

一个基于 `Node.js + Express + Vanilla JS + Canvas` 的鼠标定位训练 Web 应用。  
这个 README 主要写给“接手项目的人 / 另一个 Codex / 新协作者”看，目标是一眼看懂项目结构、运行方式、数据流和改动入口。

## 1. 项目是什么

这是一个前后端一体的鼠标训练项目，不是纯静态网站。

它现在已经具备这些能力：

- 账号注册 / 登录
- 本地试玩与登录后云端存档
- 多训练模式
- 统计页 / 成就页 / 设置页
- DPI 测试模式
- Windows 一键启动脚本

它的定位更像“轻量 Web 游戏 + 训练工具”，而不是通用后台系统。

## 2. 先记住这几个入口

如果只想快速接手，先看这几个文件：

- [server.js](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/server.js)
  - 后端唯一入口
  - 提供 API
  - 托管 `index.html`、`/css`、`/js`
  - 负责 JSON 文件存储
- [index.html](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/index.html)
  - 唯一页面入口
  - 所有视图都在同一个 HTML 里
  - 各 JS 文件通过 `<script>` 顺序加载
- [js/app.js](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/js/app.js)
  - 前端启动入口
  - 负责 boot 顺序、全局实例暴露、全局事件监听
- [js/ui.js](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/js/ui.js)
  - 页面交互主控
  - 负责导航、登录弹窗、设置保存、模式切换、通知
- [js/engine.js](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/js/engine.js)
  - 训练引擎核心
  - 管理游戏状态、计时、点击、渲染、结果结算
- [js/modes/](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/js/modes)
  - 各训练模式的具体实现

## 3. 当前架构怎么跑

### 后端

后端非常轻量，核心逻辑都在 [server.js](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/server.js)：

- `Express` 提供 API
- `express.static` 托管 `/css` 和 `/js`
- 根路径 `/` 返回 `index.html`
- 其他非 `/api/*` 路径统一回退到 `index.html`
- 用户数据保存在本地 JSON 文件

### 前端

前端是单页面应用，但没有使用 React / Vue。

它的方式是：

1. `index.html` 一次性渲染所有主要视图容器
2. `app.js` 在 `DOMContentLoaded` 后启动应用
3. `AuthManager / UIManager / StatsManager / GameEngine` 各自接管一部分职责
4. 各训练模式通过 `GameEngine` 注入和切换

## 4. 启动顺序

### 本地启动

```bash
npm install
npm start
```

默认访问：

```text
http://localhost:3000
```

### Windows 双击启动

项目根目录提供：

- [start.bat](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/start.bat)
- [start.ps1](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/start.ps1)

双击 `start.bat` 就能启动。

### 注意

这个项目不是纯静态站点，不能简单当成“上传 HTML 到网站目录”来运行。  
正确方式是启动 `server.js`，然后用 Nginx / 宝塔反向代理到 `3000` 端口。

## 5. 项目结构

```text
pick-pick/
├─ css/
│  └─ style.css                # 全局样式
├─ data/
│  └─ .gitkeep                 # 本地存储目录，运行后会生成 app-data.json
├─ deploy/                     # 旧部署配置参考，和当前代码不一定完全同步
├─ js/
│  ├─ api.js                   # fetch 封装
│  ├─ app.js                   # 前端启动入口
│  ├─ auth.js                  # 登录态与云端同步
│  ├─ audio.js                 # 音效控制
│  ├─ engine.js                # 游戏引擎核心
│  ├─ sensitivity.js           # 灵敏度换算
│  ├─ stats.js                 # 统计数据展示与图表
│  ├─ storage.js               # localStorage 封装
│  ├─ ui.js                    # UI 交互与页面编排
│  └─ modes/
│     ├─ flicking.js           # 点击模式
│     ├─ tracking.js           # 追踪模式
│     ├─ switching.js          # 切换模式
│     ├─ reflex.js             # 闪现模式
│     ├─ sixtarget.js          # 六目标模式
│     └─ dpi.js                # DPI 测试模式
├─ .env.example
├─ .gitignore
├─ database.sql                # 未来迁移关系型数据库时的结构参考
├─ game.js                     # 历史遗留文件，当前主流程未使用
├─ index.html                  # 页面骨架
├─ package.json
├─ README.md
├─ server.js
├─ server.out.log              # 运行日志（如果本地启动时生成）
├─ server.err.log              # 错误日志（如果本地启动时生成）
├─ start.bat
└─ start.ps1
```

## 6. 前端模块职责

### `app.js`

负责应用启动编排：

- 创建全局实例
- 调用 `window.auth.bootstrap()`
- 加载 `Chart.js`
- 监听 `auth:changed` 和 `game-data:updated`

如果页面“整体不工作”，优先看这个文件。

### `ui.js`

负责页面交互：

- 顶部导航切换
- 登录 / 注册弹窗
- 设置页保存
- 训练模式按钮激活
- 资料修改 / 密码修改
- 本地导入 / 导出 / 重置

如果你要改页面行为、按钮交互、视图切换，优先改这里。

### `engine.js`

负责训练核心流程：

- 启动训练
- 接收点击
- 维护 `score / hits / shots / combo / accuracy`
- 驱动渲染循环
- 结束后保存 session
- 更新成就
- 渲染结果面板

如果你要改训练节奏、HUD 数据、结算逻辑、结果文案，优先改这里。

### `stats.js`

负责统计聚合和图表展示：

- 从 `StorageManager` 读取本地统计
- 刷新首页摘要
- 刷新统计页
- 渲染最近训练记录
- 渲染模式表现
- 画趋势图

### `storage.js`

负责本地数据层：

- 封装 `localStorage`
- 定义默认 `stats / achievements / settings / sensitivityConfig`
- 提供统一的 `getCloudPayload()` / `applyCloudPayload()`

如果后续要替换前端本地缓存结构，这个文件是第一入口。

### `auth.js`

负责登录态和云端同步：

- 登录 / 注册
- 恢复 token
- 获取当前用户
- 判断本地数据是否需要接管上传
- 同步 `stats / achievements / settings / sensitivityConfig`

这个文件是本地试玩和账号存档衔接的关键。

## 7. 训练模式怎么组织

每个训练模式都在 `js/modes/` 下单独一个文件。  
模式对象由 `GameEngine.initModeManager()` 注册。

一个模式通常包含这些方法：

- `init()`
- `update()`
- `render()`
- `handleClick(clickPos)` 可选
- `getResultSummary(...)` 可选
- `getAverageReactionTime()` 可选

### 当前模式

- `flicking`
- `tracking`
- `switching`
- `reflex`
- `sixtarget`
- `dpi`

### 新增模式怎么接

如果另一个 Codex 要加新模式，通常要改 4 个地方：

1. 新建 `js/modes/xxx.js`
2. 在 [js/engine.js](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/js/engine.js) 的 `initModeManager()` 注册
3. 在 [index.html](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/index.html) 增加模式按钮 / 首页卡片
4. 在 [js/stats.js](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/js/stats.js) 的 `getModeLabel()` 增加标签

## 8. 数据流怎么走

### 未登录

- 所有训练数据都走 `StorageManager`
- 数据保存在浏览器 `localStorage`

### 登录后

- `AuthManager.bootstrap()` 尝试恢复用户
- 前端拉取 `/api/auth/me`
- 再拉取 `/api/game-data`
- 如果本地已有试玩数据且服务端为空，前端会尝试把本地数据上传接管

### 训练结束后

训练结束发生在 [js/engine.js](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/js/engine.js)：

1. `endGame()`
2. `buildResultSummary()`
3. `saveGameData()`
4. `StatsManager.recordSession()`
5. `updateAchievements()`
6. 如果已登录，再通过 `window.auth.syncGameData(...)` 同步到服务端

## 9. 后端 API 一览

### 认证

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/profile`
- `POST /api/auth/change-password`

### 游戏数据

- `GET /api/game-data`
- `PUT /api/game-data`

### 健康检查

- `GET /api/health`

## 10. 服务端存储结构

当前默认存储文件：

```text
data/app-data.json
```

服务端按用户保存：

- `user`
- `gameData.stats`
- `gameData.achievements`
- `gameData.settings`
- `gameData.sensitivityConfig`

这个方案适合：

- 本地开发
- 小规模演示
- 作品展示

不适合：

- 多实例并发
- 正式生产级持久化

## 11. 环境变量

当前服务端直接读 `process.env`，没有自动加载 `dotenv`。

可用环境变量：

```env
PORT=3000
JWT_SECRET=change-me-before-production
DATA_FILE=./data/app-data.json
```

### 很重要

虽然仓库里有 `.env.example`，但代码当前没有调用 `dotenv.config()`。  
也就是说如果要用 `.env` 文件，需要：

- 自己在启动命令里注入环境变量
- 或者后续给项目补上 `dotenv`

## 12. 当前已知情况

这些点另一个 Codex 接手时最好先知道：

- `mysql2` 还在 `package.json`，但当前默认流程没有真正使用 MySQL
- `cors` 也在依赖里，但当前 `server.js` 没有用到
- `game.js` 是历史遗留文件，不是当前主流程入口
- `deploy/` 目录里的历史部署配置不一定和当前代码完全同步
- `database.sql` 只是未来迁移数据库时的参考，不是当前运行依赖

## 13. 如果要继续改，建议优先看这些点

### 想改 UI / 文案 / 交互

看：

- [index.html](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/index.html)
- [css/style.css](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/css/style.css)
- [js/ui.js](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/js/ui.js)

### 想改训练难度 / 目标行为 / 结果逻辑

看：

- [js/engine.js](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/js/engine.js)
- [js/modes/](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/js/modes)

### 想改登录和存档

看：

- [server.js](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/server.js)
- [js/auth.js](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/js/auth.js)
- [js/storage.js](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/js/storage.js)

### 想接数据库

优先改：

- [server.js](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/server.js)
- [database.sql](C:/Users/21232/Desktop/kaifa/HTTP/pick/pick-pick/database.sql)

## 14. 后续推荐方向

- 把 `server.js` 拆成 routes / services / storage 三层
- 引入真正的数据库
- 给模式系统补统一接口文档
- 给 API 补参数校验
- 补自动化测试
- 统一处理环境变量加载

## 15. 参考来源

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Chart.js](https://www.chartjs.org/)
- 训练模式参考：[trainGun](https://github.com/lby-1/trainGun)
- DPI 测试思路参考：`Speed-Accuracy-Test-master`

---

如果另一个 Codex 只看一句话版总结：

> 这是一个“单 HTML 页面 + 多 JS 管理器 + 一个 Express 入口 + 本地 JSON 存储”的鼠标训练 Web 应用；前端主入口是 `app.js`，训练核心在 `engine.js`，模式扩展点在 `js/modes/`，账号和存档关键点在 `auth.js` 与 `server.js`。
