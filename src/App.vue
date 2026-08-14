<template>
  <!-- 顶部导航栏：传入标签页配置与当前激活项，监听切换事件 -->
  <AppNav :tabs="tabs" :current="current" @switch="navigate" />
  <!-- 主内容区：根据当前组件动态渲染对应页面 -->
  <main>
    <!-- 使用动态组件渲染当前页面，key 用于强制重新创建组件实例 -->
    <component :is="currentComp" :key="current" class="page" />
  </main>
  <!-- 底部页脚 -->
  <AppFooter />

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
import { ref, computed, provide, onMounted, onUnmounted } from 'vue'
// 导入顶部导航栏组件
import AppNav from './components/AppNav.vue'
// 导入底部页脚组件
import AppFooter from './components/AppFooter.vue'
// 导入图标组件（统一渲染各 SVG 图标）
import AppIcon from './components/AppIcon.vue'
// 导入页面导航配置（key / label / comp）
import { tabs } from './data/tabs.js'
// 导入工具子页面（如 JSON 格式化查看器、随机密码生成器），通过 #/tools/<sub> 访问
import JsonViewer from './pages/JsonViewer.vue'
import PasswordGenerator from './pages/PasswordGenerator.vue'

// 工具页支持的站内子页面映射：hash 子路径 -> 组件
const toolSubPages = {
  jsonviewer: JsonViewer,
  passwordgenerator: PasswordGenerator
}

// 从 URL hash 解析当前页与子页面（支持刷新保持 / 直接访问 #/tools/jsonviewer）
function parseHash() {
  // 去除 hash 中的 # 与可选斜杠，得到形如 "tools/jsonviewer" 的路径
  const h = (window.location.hash || '').replace(/^#\/?/, '')
  // 拆出主 key 与可选子路径
  const [key, sub] = h.split('/')
  // 主 key 合法则使用，否则回退到首页
  const validKey = tabs.some((t) => t.key === key) ? key : 'home'
  // 子路径必须对应工具页支持的子页面，否则视为无子页面
  const validSub = validKey === 'tools' && toolSubPages[sub] ? sub : ''
  return { key: validKey, sub: validSub }
}

// 当前激活的 tab key 与子页面（初始化时根据 URL hash 解析）
const { key: initialKey, sub: initialSub } = parseHash()
const current = ref(initialKey)
const currentSub = ref(initialSub)

// 根据当前 key 计算出需要渲染的页面组件（优先渲染工具子页面）
const currentComp = computed(() => {
  if (current.value === 'tools' && currentSub.value) {
    return toolSubPages[currentSub.value]
  }
  return tabs.find((t) => t.key === current.value).comp
})

// tab 切换 = 改变 URL hash；真正的内容切换由 hashchange 驱动
function navigate(key) {
  // 若切换到当前已激活的 tab
  if (key === current.value) {
    // 且为首页时，滚动到顶部
    if (key === 'home') {
      try {
        // 尝试滚动到页面顶部
        window.scrollTo({ top: 0 })
      } catch (e) {
        /* 某些内嵌环境无 scrollTo，忽略 */
      }
    } else if (currentSub.value) {
      // 已处于工具子页面时再次点击「工具」：回到工具列表页
      window.location.hash = '#/tools'
    }
    return
  }
  // 否则通过设置 hash 触发 hashchange 完成切换
  window.location.hash = '#/' + key
}

// 监听 URL hash 变化，同步更新当前 tab / 子页面并滚动到顶部
function onHashChange() {
  // 根据新的 hash 更新当前激活 tab 与子页面
  const { key, sub } = parseHash()
  current.value = key
  currentSub.value = sub
  try {
    // 切换后滚动到页面顶部
    window.scrollTo({ top: 0 })
  } catch (e) {
    /* 某些内嵌环境无 scrollTo，忽略 */
  }
}

// 组件挂载时注册 hashchange 监听
onMounted(() => window.addEventListener('hashchange', onHashChange))
// 组件卸载时移除 hashchange 监听，避免内存泄漏
onUnmounted(() => window.removeEventListener('hashchange', onHashChange))

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
</script>

<style scoped>
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
  stroke: #ff6b35;
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
  color: #ff6b35;
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
