# 知识分享站

知识分享站是一个基于 **Vue 3 + Vite** 构建的轻量个人静态网站，聚焦人工智能与实用工具领域，以「拆解技术、落地应用、共享价值」为核心，提供通俗易懂、实战性强的原创内容，并内置一系列**纯前端在线工具**。

## ✨ 功能特性

- **四大板块**
  - 🏠 **首页**：站点介绍 + 网站直达入口（工具 / 资讯 / 关于）
  - 🧰 **工具**：主流 AI 工具、平台与免费开放 API 的实操指南（瀑布流卡片布局）；同时内置 **JSON 格式化、密码生成、Base64、MD5、URL 转码、图片转 Base64、颜色转换** 等 7 款纯前端在线工具，打开即用
  - 📰 **资讯**：按日期分组归档的前沿 AI / 科技资讯，点击日期可展开 / 收起；页面叠加「资讯由 AI 自动生成，如有侵权，请联系删除。」半透明水印
  - 👤 **关于**：作者介绍、学习经历与 GitHub 开源项目导航
- **亮 / 暗双主题**：基于 CSS 变量的主题系统，支持一键切换，偏好通过 `localStorage` 持久化，并支持**跨标签页 / 窗口实时同步**
- **Hash 路由**：原生 `hashchange` 驱动的轻量路由（`#/home`、`#/tools`、`#/about`…），刷新保持当前页、可直接访问指定板块
- **在线工具统一体验**：双端拖拽分割布局（桌面左右 / 移动上下）、复制、清空、输入输出互换、一键载入示例，均复用公共 composable
- **响应式布局**：移动端自动切换为单列，导航 Tab 支持横向滚动
- **页面切换动画**：纯 CSS 进入动画，尊重系统「减少动态效果」设置
- **吸顶毛玻璃导航** + **回到顶部**悬浮按钮

## 🧰 内置在线工具

| 工具 | 地址 | 说明 |
| --- | --- | --- |
| JSON 格式化查看器 | `#/tools/jsonviewer` | 美化 / 压缩、语法高亮、搜索定位、一键复制与下载 |
| 随机密码生成器 | `#/tools/pwdgenerator` | 自定义字符集与长度，加密随机数生成，一键复制 |
| BASE64 加密 / 解密 | `#/tools/base64codec` | 支持 UTF-8 与 GBK 编码，加密 / 解密切换 |
| MD5 加密 | `#/tools/md5hash` | 32 位小写 MD5，本地计算不上传 |
| URL 在线转码 / 解码 | `#/tools/urlcodec` | encodeURIComponent 转码 / 解码，内置示例 |
| 图片转 Base64 编码 | `#/tools/imagebase64` | 点击 / 拖拽上传自动转换，支持互换还原图片、复制图片 |
| RGB / Hex 颜色转换工具 | `#/tools/colorconverter` | RGB 与十六进制互转，带滑块与实时色块预览 |

> 另有 AI 工具与免费 API 推荐清单，见 `src/data/tools.js`。

## 🛠 技术栈

| 类别 | 说明 |
| --- | --- |
| 前端框架 | Vue 3（`<script setup>` 语法） |
| 构建工具 | Vite 5 |
| 路由方案 | 原生 `hashchange` 事件驱动的轻量路由（无第三方路由库） |
| 状态共享 | Composition API + `provide / inject`（`composables/useTheme.js`） |
| 公共逻辑 | `useClipboard`（复制，含降级）、`useSplitPane`（双端拖拽分割）、`useToolStandalone`（工具页全屏）、`useMasonry`（瀑布流） |
| 样式 | 原生 CSS + CSS 变量（主题 / 间距统一维护），含 `scoped` 局部样式 |
| 主题持久化 | `localStorage`（`explorenet-theme`）+ `storage` 事件跨窗口同步 |

## 📂 项目结构

```
ExploreNet/
├── index.html              # 入口 HTML，含主题预设置内联脚本
├── vite.config.js          # Vite 配置
├── package.json
└── src/
    ├── main.js             # 应用入口，挂载 App、引入全局样式与主题
    ├── App.vue             # 根组件：hash 路由调度、导航 / 页脚装配、工具子页面注册
    ├── style.css           # 全局样式 + 亮暗主题变量 + 响应式
    ├── components/
    │   ├── AppNav.vue       # 吸顶导航栏（Logo + Tab + 主题切换）
    │   ├── AppFooter.vue    # 页脚
    │   ├── ThemeToggle.vue  # 日 / 夜模式切换开关
    │   ├── ToolCard.vue     # 工具卡片
    │   └── NewsPanel.vue    # 资讯按日期折叠面板
    ├── composables/
    │   ├── useTheme.js      # 主题状态与切换（全局单例，含跨窗口同步）
    │   ├── useClipboard.js  # 文本复制（navigator.clipboard + 降级方案）
    │   ├── useSplitPane.js  # 双端拖拽分割布局（桌面左右 / 移动上下）
    │   ├── useToolStandalone.js # 工具页全屏独立模式
    │   └── useMasonry.js    # 工具页瀑布流布局
    ├── data/
    │   ├── home.js          # 首页数据源
    │   ├── tools.js         # 工具板块数据源（AI 工具 + 在线工具注册）
    │   └── news.js          # 资讯板块数据源（按日期分组）
    └── pages/
        ├── HomePage.vue     # 首页
        ├── ToolsPage.vue    # 工具页
        ├── NewsPage.vue     # 资讯页（含水印）
        ├── AboutPage.vue    # 关于页
        └── tools/           # 内置在线工具页
            ├── JsonViewer.vue    # JSON 格式化查看器
            ├── PwdGenerator.vue  # 随机密码生成器
            ├── Base64Codec.vue   # BASE64 加密 / 解密
            ├── Md5Hash.vue       # MD5 加密
            ├── UrlCodec.vue      # URL 转码 / 解码
            ├── ImageBase64.vue   # 图片转 Base64
            └── ColorConverter.vue # RGB / Hex 颜色转换
```

## 🚀 快速开始

环境要求：Node.js（建议 18+）

```bash
# 安装依赖
npm install

# 启动本地开发服务器（默认 http://localhost:5173）
npm run dev

# 构建生产版本（输出到 dist/）
npm run build

# 预览生产构建
npm run preview
```

## 🔧 自定义与扩展

- **首页内容**：编辑 `src/data/home.js`。
- **新增在线工具**：在 `src/pages/tools/` 下新建组件（复用 `useSplitPane` / `useToolStandalone` / `useClipboard`），在 `src/App.vue` 的 `toolSubPages` 注册 hash 子路径，再到 `src/data/tools.js` 添加卡片即可，自动接入 `#/tools/<page>` 路由。
- **修改工具推荐**：编辑 `src/data/tools.js`，支持 `name`、`desc`、`features`、`link`、`linkText` 等字段。
- **新增 / 修改资讯**：编辑 `src/data/news.js`，按日期分组（`date` + `expanded` + `items[]`）。
- **调整主题配色**：修改 `src/style.css` 的 `:root` 与 `[data-theme="dark"]` 中的 CSS 变量。

## 📄 说明

本站为个人学习分享用途，内容均为原创打磨与整理。内置在线工具均在浏览器本地完成计算，不上传任何数据；工具板块涉及的网络工具仅用于合规的技术学习与资料查阅，请严格遵守所在地法律法规。
