// ===== 不蒜子 busuanzi 统计 composable =====
// busuanzi 脚本基于 JSONP：脚本加载后立即发起请求，回调中将数值写入 DOM 元素。
// SPA 中若在 index.html 静态引入脚本，Vue 组件尚未渲染、容器 span 不存在，
// JSONP 回调会静默失败（getElementById 返回 null）。
// 故在组件 onMounted 后动态注入脚本，确保容器 DOM 已就绪。

import { onMounted } from 'vue'

// 不蒜子官方脚本地址（注意域名是 ibruce.info，不是 ibruco.info）
const BUSUANZI_SRC = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'

export function useBusuanzi() {
  onMounted(() => {
    // 已注入则跳过，避免重复加载
    if (document.getElementById('busuanzi-script')) return
    const script = document.createElement('script')
    script.id = 'busuanzi-script'
    script.async = true
    script.src = BUSUANZI_SRC
    document.body.appendChild(script)
  })
}
