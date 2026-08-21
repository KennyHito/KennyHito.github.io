// ===== 数据：首页内容（核心板块 pillars + 站点介绍 intro）=====
// pillars：首页三大核心板块。字段：index 序号、icon 图标、title 标题、desc 描述、go 按钮文案、target 跳转目标 key
export const pillars = [
  {
    index: '01',
    icon: '🧰',
    title: '开发工具箱',
    desc: '多款纯浏览器本地小工具——JSON 格式化、Base64、MD5、颜色转换、文件对比等，数据不上传；另附 AI 智能体与免费 API 资源，即开即用。',
    go: '去工具箱',
    target: 'tools'
  },
  {
    index: '02',
    icon: '📰',
    title: '前沿资讯',
    desc: '每日更新 AI 与科技前沿：模型发布、行业动态、论文研究与实用技巧，一手信息持续稳定输出，帮你少刷水文。',
    go: '看资讯',
    target: 'news'
  },
  {
    index: '03',
    icon: '👤',
    title: '关于与拆解',
    desc: '前端 / iOS 开发者的学习笔记与开源项目，技术拆解、踩坑复盘，无广告、无营销，纯干货分享。',
    go: '了解站长',
    target: 'about'
  }
]

// intro：关于页「关于本站」介绍段落数组，每个元素为一段纯文本字符串
export const intro = [
  '本站基于 Vue 3 + Vite 构建，是一个纯前端静态站点，托管于 GitHub Pages，无后端依赖；路由采用 vue-router（hash 模式）以适配静态托管，支持亮 / 暗主题一键切换，并可跨标签页实时同步。',
  '站点主要包含三大板块：开发工具箱（JSON 格式化、Base64、MD5、颜色转换、文件对比等多款浏览器本地小工具，数据均不上传）、前沿资讯（每日聚合 AI 与科技动态），以及基于 Giscus 的留言区（收到新评论会通过飞书实时通知站长）。'
]
