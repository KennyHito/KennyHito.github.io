// ===== 站点全局配置（单一数据源）=====
// 本文件集中管理站点基础信息、链接、联系方式、开源仓库列表与 Giscus 评论配置。
// 修改站名 / 链接 / 邮箱 / 仓库 / 评论参数，只需改这里，其它页面统一读取本文件的导出。
//
// 站主信息（昵称 / GitHub 用户名）由下方 author 常量统一定义；所有展示文本与派生值
// （GitHub 主页、反馈邮箱、页脚版权、Giscus 仓库）都读取 author，改站主名只动这一处，
// 不会出现硬编码散落各文件的情况。

// 站点作者（站主昵称 / GitHub 用户名）：关于页展示名、页脚版权、GitHub 主页、反馈邮箱、Giscus 仓库均由其派生
export const author = 'KennyHito'

export const site = {
  // 站点作者：直接引用 author 常量（单一来源，不要在此硬编码昵称）
  author: author,
  // 站点名称
  name: '知识分享站',
  // 站点 Slogan（移动端菜单底部展示）
  slogan: '探索、分享、记录技术点滴',
  // GitHub 主页：由 author 派生（https://github.com/{author}）
  github: 'https://github.com/' + author,
  // 反馈邮箱：由 author 派生（{author}@gmail.com）
  email: author + '@gmail.com',
  // 个人网站（关于页展示）
  devnote: 'https://devnote.site',
  // 自用网络链接（关于页展示）
  vpn: 'https://go.huajic.com/?path=auth/register&code=d39H',
  // ===== Giscus 评论系统配置（留言页 MessageBoard 使用）=====
  // repo 格式为 {owner}/{name}：owner 与 name 均从 author 派生（GitHub Pages 仓库名为 {author}.github.io）
  giscus: {
    // GitHub 仓库（owner/name）
    repo: author + '/' + author + '.github.io',
    // 仓库节点 ID（data-repo-id，非可见名称，形如 R_kg...）
    repoId: 'R_kgDOOu_ypA',
    // Discussions 分类名称（data-category，仅展示/校验用，实际以 categoryId 定位）
    category: 'Announcements',
    // 分类节点 ID（data-category-id，形如 DIC_kw...）
    categoryId: 'DIC_kwDOOu_ypM4DDs5D',
    // 讨论串映射方式：pathname = 按页面路径定位（留言页固定路径即固定讨论串）
    mapping: 'pathname',
    // 是否严格匹配 pathname（0/1）
    strict: '0',
    // 是否显示反应表情（0/1）
    reactionsEnabled: '1',
    // 是否回传页面元数据（0/1）：必须开启 1，否则 Giscus 不会向父页面
    // postMessage discussion 元数据，前端也就拿不到评论数变化来触发飞书通知
    emitMetadata: '1',
    // 输入框位置：top / bottom
    inputPosition: 'bottom',
    // 界面语言
    lang: 'zh-CN',
    // 评论区主题：'sync' = 跟随站点明暗切换（推荐）；'system' = 跟随访客系统配色（preferred_color_scheme）
    themeMode: 'sync'
  },
  // ===== 留言成功通知配置 =====
  // 评论成功发布后，向前端配置的飞书机器人 webhook 推送一条通知。
  // 纯前端 fetch 即可：飞书自定义机器人 webhook 已开放 CORS（access-control-allow-origin: *）。
  notify: {
    // 飞书自定义机器人 webhook 地址（open.feishu.cn/open-apis/bot/v2/hook/...）
    feishuWebhook: 'https://open.feishu.cn/open-apis/bot/v2/hook/834ca0ac-de7a-49be-bb1f-4ee995e45b56'
  }
}

// 关于页展示的开源仓库列表（name：显示文本，url：仓库地址，均由 site.github 派生）
export const repos = [
  { name: 'StudyiOS', url: site.github + '/StudyiOS' },
  { name: 'WebBasic', url: site.github + '/WebBasic' },
  { name: 'VueBasic（第一部分）', url: site.github + '/VueBasic' },
  { name: 'VueTest（第二部分）', url: site.github + '/VueTest' },
  { name: 'Vue3Test（第三部分）', url: site.github + '/Vue3Test' },
  { name: 'HelloVue3', url: site.github + '/HelloVue3' }
]
