# 知识分享站

知识分享站是一个基于 **Vue 3 + Vite** 构建的轻量个人静态网站，聚焦人工智能与实用工具领域，以「拆解技术、落地应用、共享价值」为核心，提供通俗易懂、实战性强的原创内容。

## ✨ 功能特性

- **四大板块**
  - 🏠 **首页**：站点介绍 + 网站直达入口（工具 / 资讯 / 关于）
  - 🧰 **工具**：主流 AI 工具、平台与免费开放 API 的实操指南，附带官方直达链接；卡片采用**瀑布流布局**，按内容高度自然排列、左右无需等高
  - 📰 **资讯**：按日期分组归档的前沿 AI / 科技资讯，点击日期可展开 / 收起，最新内容默认展开；页面叠加「资讯由 AI 自动生成，如有侵权，请联系删除。」半透明水印，自动适配亮 / 暗主题
  - 👤 **关于**：作者介绍、学习经历与 GitHub 开源项目导航
- **亮 / 暗双主题**：基于 CSS 变量的主题系统，支持一键切换，偏好通过 `localStorage` 持久化；首屏内联脚本提前设置主题属性，**无主题闪烁**
- **Hash 路由**：基于 URL hash 的轻量路由（`#/home`、`#/tools`、`#/news`、`#/about`），刷新可保持当前页、可直接访问指定板块
- **响应式布局**：移动端（≤734px）自动切换为单列，导航 Tab 支持横向滚动
- **页面切换动画**：纯 CSS 进入动画，并尊重系统「减少动态效果」无障碍设置
- **吸顶毛玻璃导航**：滚动时固定顶部，半透明 + 背景模糊
- **回到顶部**：任意页面下滑超过半屏后，右下角出现悬浮按钮，点击平滑滚动回顶部

## 🧰 工具清单

<table>
<tr><th>工具</th><th>简介</th><th width="80">链接</th></tr>
<tr><td>⭐️ 科学上网 VPN（合规学习用途）</td><td>合规查阅海外 AI 官方文档、技术资料的合规网络工具</td><td width="80" align="center"><a href="https://go.huajic.com/?path=auth/register&code=d39H" target="_blank" rel="noopener noreferrer">官网</a></td></tr>
<tr><td>OpenClaw 智能体</td><td>轻量化、低代码 AI 多智能体框架，支持插件拓展、知识库对接</td><td width="80" align="center"><a href="https://docs.openclaw.ai/zh-CN" target="_blank" rel="noopener noreferrer">文档</a></td></tr>
<tr><td>⭐️ WorkBuddy 自动化 AI 办公助手</td><td>腾讯云推出的全场景 AI 办公工作台，网页 / 桌面双模式</td><td width="80" align="center"><a href="https://www.codebuddy.cn/docs/workbuddy/Overview" target="_blank" rel="noopener noreferrer">官网</a></td></tr>
<tr><td>Coze 零代码搭建 AI 智能体</td><td>字节跳动开源可商用的零代码智能体平台</td><td width="80" align="center"><a href="https://www.coze.cn" target="_blank" rel="noopener noreferrer">官网</a></td></tr>
<tr><td>DeepSeek API 开放平台</td><td>高性价比大模型 API，兼容 OpenAI 协议</td><td width="80" align="center"><a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer">平台</a></td></tr>
<tr><td>Ollama 本地大模型运行</td><td>开源免费本地大模型运行框架，支持多模型、跨平台</td><td width="80" align="center"><a href="https://ollama.com/" target="_blank" rel="noopener noreferrer">官网</a></td></tr>
<tr><td>GitHub 用户搜索 API（官方免费）</td><td>官方接口，链接末尾拼接用户名即可查询公开资料（示例 ?q=KennyHito）</td><td width="80" align="center"><a href="https://api.github.com/search/users?q=" target="_blank" rel="noopener noreferrer">接口</a></td></tr>
<tr><td>每日一言 API（免费开放）</td><td>免费每日一句语录接口，即取即用、无需参数</td><td width="80" align="center"><a href="https://api.xygeng.cn/one" target="_blank" rel="noopener noreferrer">接口</a></td></tr>
<tr><td>Hitokoto 一言 API（免费开放）</td><td>社区句子库，内容来自真实用户投稿，支持按类型筛选与来源署名</td><td width="80" align="center"><a href="https://v1.hitokoto.cn/" target="_blank" rel="noopener noreferrer">接口</a></td></tr>
<tr><td>随机猫咪图片 API（免费开放）</td><td>免费随机高清猫咪图片，适合占位图、表情包</td><td width="80" align="center"><a href="https://api.thecatapi.com/v1/images/search" target="_blank" rel="noopener noreferrer">接口</a></td></tr>
<tr><td>随机狗狗图片 API（免费开放）</td><td>免费随机多品种狗狗图片，适合占位图、趣味图集</td><td width="80" align="center"><a href="https://dog.ceo/api/breeds/image/random" target="_blank" rel="noopener noreferrer">接口</a></td></tr>
</table>

## 🛠 技术栈

| 类别 | 说明 |
| --- | --- |
| 前端框架 | Vue 3（`<script setup>` 语法） |
| 构建工具 | Vite 5 |
| 路由方案 | 原生 `hashchange` 事件驱动的轻量路由（无第三方路由库） |
| 状态共享 | Vue `provide / inject` + Composition API（`composables/useTheme.js`） |
| 样式 | 原生 CSS + CSS 变量（主题 / 间距统一维护），含 `scoped` 局部样式 |
| 主题持久化 | `localStorage`（`explorenet-theme`） |

## 📂 项目结构

```
ExploreNet/
├── index.html              # 入口 HTML，含主题预设置内联脚本
├── vite.config.js          # Vite 配置
├── package.json
├── favicon.ico / main_icon.png
└── src/
    ├── main.js             # 应用入口，挂载 App、引入全局样式与主题
    ├── App.vue             # 根组件：路由调度、导航 / 页脚装配
    ├── style.css           # 全局样式 + 亮暗主题变量 + 响应式
    ├── components/
    │   ├── AppNav.vue       # 吸顶导航栏（Logo + Tab + 主题切换）
    │   ├── AppFooter.vue    # 页脚
    │   ├── ThemeToggle.vue  # 日 / 夜模式切换按钮
    │   ├── ToolCard.vue     # 工具卡片
    │   └── NewsPanel.vue    # 资讯按日期折叠面板
    ├── composables/
    │   ├── useTheme.js      # 主题状态与切换逻辑（全局单例）
    │   └── useMasonry.js    # 工具页瀑布流布局 composable
    ├── data/
    │   ├── home.js          # 首页 features / intro 数据源
    │   ├── tools.js         # 工具板块数据源
    │   └── news.js          # 资讯板块数据源（按日期分组）
    └── pages/
        ├── HomePage.vue     # 首页
        ├── ToolsPage.vue    # 工具页
        ├── NewsPage.vue     # 资讯页（含水印）
        └── AboutPage.vue    # 关于页
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

- **首页内容**：编辑 `src/data/home.js`，可调整 `features`（站点直达卡片）与 `intro`（站点介绍文案）。
- **新增 / 修改工具**：编辑 `src/data/tools.js`，每条记录支持 `name`、`desc`、`features`、`steps`、`scenarios`、`link`、`linkText` 等字段，卡片会自动渲染。
- **新增 / 修改资讯**：编辑 `src/data/news.js`，按日期分组（`date` + `expanded` + `items[]`），`expanded: true` 的日期默认展开。
- **资讯水印文案**：修改 `src/pages/NewsPage.vue` 中 SVG 背景图的 `text` 内容。
- **调整主题配色**：在 `src/style.css` 的 `:root` 与 `[data-theme="dark"]` 中修改 CSS 变量（如 `--accent` 强调色、`--bg` 背景色等）。
- **新增页面 / 板块**：在 `src/pages/` 下新建页面组件，并在 `src/App.vue` 的 `tabs` 数组中注册即可（路由由 hash 自动驱动）。

## 📄 说明

本站为个人学习分享用途，内容均为原创打磨与整理，不跟风流量、不堆砌无效信息。工具板块涉及的网络工具仅用于合规的技术学习与资料查阅，请严格遵守所在地法律法规。