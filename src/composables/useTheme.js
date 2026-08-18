// ===== 组合式函数：主题切换（亮 / 暗，持久化 + 跨页同步）=====
import { ref, watch } from 'vue'

const STORAGE_KEY = 'knowshare-theme'

function initial() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'light'
  } catch (e) {
    return 'light'
  }
}

const theme = ref(initial())

function apply(value) {
  document.documentElement.setAttribute('data-theme', value)
}

// 模块加载即应用（main.js 已 import，index.html 内联脚本已提前设置避免闪烁）
apply(theme.value)

watch(theme, (value) => {
  apply(value)
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch (e) {}
})

// 跨标签页/窗口同步：首页切换主题后，其他已打开窗口的工具页自动跟随
// storage 事件只在“其他文档”修改 localStorage 时触发（同一窗口内不触发），正好符合需求
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY && e.newValue && e.newValue !== theme.value) {
    theme.value = e.newValue
  }
})

// 导出组合式函数：返回 theme（当前主题 ref）与 toggle（切换亮/暗主题）
export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }
  return { theme, toggle }
}
