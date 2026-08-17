// ===== 数据：站点基础配置与开源仓库列表 =====
// 站点基础配置：全局共享的链接、联系方式与开源仓库列表
// 需要修改站名 / 链接 / 邮箱 / 仓库时，只改本文件即可
export const site = {
  // 站点名称
  name: '知识分享站',
  // 站点 Slogan（移动端菜单底部展示）
  slogan: '探索、分享、记录技术点滴',
  // GitHub 主页
  github: 'https://github.com/KennyHito',
  // 反馈邮箱
  email: 'KennyHito@gmail.com',
  // 个人网站（关于页展示）
  devnote: 'https://devnote.site',
  // 自用网络链接（关于页展示）
  vpn: 'https://go.huajic.com/?path=auth/register&code=d39H'
}

// 关于页展示的开源仓库列表（name：显示文本，url：仓库地址）
export const repos = [
  { name: 'StudyiOS', url: site.github + '/StudyiOS' },
  { name: 'WebBasic', url: site.github + '/WebBasic' },
  { name: 'VueBasic（第一部分）', url: site.github + '/VueBasic' },
  { name: 'VueTest（第二部分）', url: site.github + '/VueTest' },
  { name: 'Vue3Test（第三部分）', url: site.github + '/Vue3Test' },
  { name: 'HelloVue3', url: site.github + '/HelloVue3' }
]
