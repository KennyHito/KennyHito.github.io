// ===== 组合式函数：剪贴板复制（带降级方案）=====
// 统一剪贴板复制逻辑
// 优先使用 Clipboard API（仅在安全上下文可用），
// 失败或不可用时降级为隐藏 textarea + document.execCommand('copy')，
// 兼容企微 WebView 等非 HTTPS / 旧浏览器环境。

// 降级方案：通过隐藏 textarea 选中 + execCommand('copy') 复制
function fallbackCopy(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.top = '-9999px' // 移出可视区域
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  ta.setSelectionRange(0, text.length)
  const ok = document.execCommand('copy')
  document.body.removeChild(ta)
  return ok
}

// 复制文本到剪贴板，返回 Promise<boolean> 表示是否成功
export async function copyText(text) {
  if (!text) return false
  let ok = false
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      ok = true
    } else {
      ok = fallbackCopy(text)
    }
  } catch (e) {
    ok = fallbackCopy(text)
  }
  return ok
}
