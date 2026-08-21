<!-- ===== 根组件 App：路由切换 + 全局布局（导航/页脚/主题/回到顶部） ===== -->
<template>
  <!-- 顶部导航栏：传入标签页配置与当前激活项，监听切换事件 -->
  <AppNav :tabs="tabs" :current="current" @switch="navigate" />
  <!-- 主内容区：由 vue-router 的 <router-view> 按路由渲染对应页面 -->
  <main class="app-main">
    <!-- 留言板首次进入后常驻挂载，用 v-show 仅隐藏不卸载，
         避免 Giscus 的 iframe 在路由切换时被浏览器重新加载（KeepAlive 对 iframe 无效）；
         message 路由本身渲染空 stub，留言板由下方单独常驻渲染 -->
    <MessageBoard v-if="messageMounted" v-show="current === 'message'" class="page" />
    <router-view />
  </main>
  <!-- 底部页脚 -->
  <AppFooter />

  <!-- 全局搜索弹窗：由导航栏搜索按钮唤起，通过 openSearch 注入到各组件 -->
  <SearchModal :open="searchOpen" @close="searchOpen = false" />

  <!-- 回到顶部：滚动超过半屏后悬浮于右下角 -->
  <transition name="backtop-fade">
    <button v-if="showBackTop" class="back-to-top" @click="backToTop" aria-label="回到顶部">
      <!-- 进度环 -->
      <svg class="back-to-top-ring" viewBox="0 0 44 44" aria-hidden="true">
        <circle class="back-to-top-ring-bg" cx="22" cy="22" r="19" />
        <circle class="back-to-top-ring-progress" cx="22" cy="22" r="19" :stroke-dasharray="119.38"
          :stroke-dashoffset="119.38 - (119.38 * scrollPercent) / 100" />
      </svg>
      <!-- 上箭头 -->
      <AppIcon name="arrow-up" :size="18" class="back-to-top-icon" />
      <!-- 悬浮提示 -->
      <span class="back-to-top-tooltip">回到顶部</span>
    </button>
  </transition>
</template>

<script setup>
// 从 Vue 中导入响应式状态、计算属性、依赖注入及生命周期钩子
import { ref, computed, provide, onMounted, onUnmounted, watch } from 'vue'
// 导入 vue-router：useRoute 读取当前路由、useRouter 用于编程式跳转
import { useRoute, useRouter } from 'vue-router'
// 导入顶部导航栏组件
import AppNav from './components/AppNav.vue'
// 导入底部页脚组件
import AppFooter from './components/AppFooter.vue'
// 导入图标组件（统一渲染各 SVG 图标）
import AppIcon from './components/AppIcon.vue'
// 导入页面导航配置（key / label）
import { tabs } from './data/tabs.js'
// 导入全局搜索弹窗组件
import SearchModal from './components/SearchModal.vue'
import MessageBoard from './pages/MessageBoard.vue'

// ===== 路由相关（vue-router）=====
// 当前激活的 tab 由路由推导：工具子页面 route.name 为 undefined，统一归到 tools 标签
const route = useRoute()
const router = useRouter()

const current = computed(() => {
  const n = route.name
  // 导航 tab（home/tools/news/message/about）直接取 route.name
  if (n && tabs.some((t) => t.key === n)) return n
  // 工具子页面（/tools/<sub>）归属 tools 标签
  if (route.path.startsWith('/tools/')) return 'tools'
  // 其余（如 404）不高亮任何标签
  return ''
})

// 留言板首次进入后才常驻挂载：避免一进首页就加载 Giscus，且切走再切回不重载 iframe
const messageMounted = ref(route.name === 'message')
watch(
  () => route.name,
  (n) => {
    if (n === 'message') messageMounted.value = true
  }
)

// tab 切换 = 路由跳转（变更 URL hash）；真正的内容渲染由 <router-view> 完成
function navigate(key) {
  // 再次点击当前已激活的 tab
  if (key === current.value) {
    if (key === 'home') {
      // 首页：滚动到顶部
      try {
        window.scrollTo({ top: 0 })
      } catch (e) {
        /* 某些内嵌环境无 scrollTo，忽略 */
      }
    } else if (key === 'tools') {
      // 已处于工具子页面时再次点击「工具」：回到工具列表页
      router.push('/tools')
    }
    return
  }
  // 否则跳转到对应路由（home 经 router 配置重定向到 /）
  router.push('/' + key)
}

// ===== 回到顶部按钮 =====
// 是否已滚动超过半屏（用于是否显示按钮）
const showBackTop = ref(false)
// 当前阅读进度 0 ~ 100
const scrollPercent = ref(0)
// 显示阈值：超过半屏高度即出现
function onScroll() {
  try {
    const scrollTop = window.scrollY || 0
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    // 钳制滚动位置：iOS 橡皮筋回弹时 scrollY 会短暂越界（负值 / 超过底部），
    // 若不钳制会导致进度环瞬间归 0 或跳到 100
    const clampedTop = Math.max(0, Math.min(scrollTop, docHeight))
    showBackTop.value = clampedTop > window.innerHeight / 2
    scrollPercent.value = docHeight > 0 ? Math.round((clampedTop / docHeight) * 100) : 0
  } catch (e) {
    /* 某些内嵌环境无 scrollY，忽略 */
  }
}
// 平滑滚动回顶部
function backToTop() {
  try {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e) {
    try {
      window.scrollTo(0, 0)
    } catch (_) {
      /* 忽略 */
    }
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  // 监听内容高度变化（如资讯展开/收起导致页面变高/变矮），立即重算进度
  const bodyObserver = new ResizeObserver(() => onScroll())
  bodyObserver.observe(document.body)
  // 初始执行一次，处理刷新后非顶部的场景
  onScroll()
  // 卸载时断开观察器
  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    bodyObserver.disconnect()
  })
})

// 供子页面（如首页快捷入口）触发 tab 切换
provide('navigate', navigate)

// 供导航栏搜索按钮唤起全局搜索弹窗
const searchOpen = ref(false)
function openSearch() {
  searchOpen.value = true
}
provide('openSearch', openSearch)

// 全局快捷键：Mac 用 Command+K，Windows 用 Ctrl+K 唤起搜索弹窗
function onKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    // 阻止浏览器默认行为（如聚焦地址栏）
    e.preventDefault()
    openSearch()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
/* 主内容区：不设 padding-top，由各页面根区块自行处理顶部留白，
   确保页面背景从浏览器最顶部开始渲染，无上方空白条 */

/* 回到顶部按钮：固定右下角，悬浮于内容之上 */
.back-to-top {
  position: fixed;
  right: 24px;
  bottom: 100px;
  z-index: 200;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--title);
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow: var(--shadow-md);
  /* 禁止长按选中、拖拽图片等原生行为 */
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  transition: background var(--transition), transform 0.1s ease, opacity var(--transition), color var(--transition);
}

/* 进度环 */
.back-to-top-ring {
  position: absolute;
  inset: -1px;
  width: calc(100% + 2px);
  height: calc(100% + 2px);
  transform: rotate(-90deg);
  pointer-events: none;
}

.back-to-top-ring circle {
  fill: none;
  stroke-width: 3;
}

.back-to-top-ring-bg {
  stroke: var(--border);
}

.back-to-top-ring-progress {
  stroke: var(--accent-warm);
  stroke-linecap: round;
  /* 注意：不要在此处写 stroke-dasharray / stroke-dashoffset，
     它们由模板中绑定的属性驱动（CSS 会覆盖 SVG 属性导致进度不更新） */
}

/* 上箭头图标（尺寸由 AppIcon 的 size 控制） */
.back-to-top-icon {
  position: relative;
  display: block;
  transition: color var(--transition);
}

/* 悬浮提示 */
.back-to-top-tooltip {
  position: absolute;
  right: 54px;
  top: 50%;
  transform: translateY(-50%) translateX(6px);
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 13px;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity var(--transition), transform var(--transition), visibility var(--transition);
}

/* 小三角 */
.back-to-top-tooltip::after {
  content: '';
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 5px 0 5px 5px;
  border-style: solid;
  border-color: transparent transparent transparent var(--border);
}

/* 悬停与按下反馈 */
.back-to-top:hover {
  background: var(--bg-secondary);
  color: var(--accent-warm);
}

.back-to-top:hover .back-to-top-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(-50%) translateX(0);
}

.back-to-top:active {
  transform: scale(0.92);
}

/* 按钮出现 / 消失的淡入淡出动画 */
.backtop-fade-enter-active,
.backtop-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.backtop-fade-enter-from,
.backtop-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* 移动端适当内缩，避免贴边 */
@media (max-width: 734px) {
  .back-to-top {
    right: 16px;
    bottom: 100px;
    width: 40px;
    height: 40px;
  }

  .back-to-top-tooltip {
    right: 50px;
    font-size: 12px;
    padding: 5px 8px;
  }
}
</style>
