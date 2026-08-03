<script setup>
// 从 Vue 中导入响应式状态、计算属性、依赖注入及生命周期钩子
import { ref, computed, provide, onMounted, onUnmounted } from 'vue'
// 导入首页页面组件
import HomePage from './pages/HomePage.vue'
// 导入工具页面组件
import ToolsPage from './pages/ToolsPage.vue'
// 导入资讯页面组件
import NewsPage from './pages/NewsPage.vue'
// 导入关于页面组件
import AboutPage from './pages/AboutPage.vue'
// 导入顶部导航栏组件
import AppNav from './components/AppNav.vue'
// 导入底部页脚组件
import AppFooter from './components/AppFooter.vue'

// 定义全部标签页配置：key 标识、label 显示文案、comp 对应页面组件
const tabs = [
  { key: 'home', label: '首页', comp: HomePage },
  { key: 'tools', label: '工具', comp: ToolsPage },
  { key: 'news', label: '资讯', comp: NewsPage },
  { key: 'about', label: '关于', comp: AboutPage }
]

// 从 URL hash 解析当前页（支持刷新保持 / 直接访问 #/tools）
function keyFromHash() {
  // 去除 hash 中的 # 与可选斜杠，得到纯 key
  const h = (window.location.hash || '').replace(/^#\/?/, '')
  // 若 key 合法则返回，否则回退到首页
  return tabs.some((t) => t.key === h) ? h : 'home'
}

// 当前激活的 tab key（初始化时根据 URL hash 解析）
const current = ref(keyFromHash())
// 根据当前 key 计算出需要渲染的页面组件
const currentComp = computed(() => tabs.find((t) => t.key === current.value).comp)

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
    }
    return
  }
  // 否则通过设置 hash 触发 hashchange 完成切换
  window.location.hash = '#/' + key
}

// 监听 URL hash 变化，同步更新当前 tab 并滚动到顶部
function onHashChange() {
  // 根据新的 hash 更新当前激活 tab
  current.value = keyFromHash()
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
// 是否已滚动超过一屏（用于是否显示按钮）
const showBackTop = ref(false)
// 显示阈值：超过一屏高度才出现
function onScroll() {
  try {
    showBackTop.value = window.scrollY > window.innerHeight
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
  // 初始执行一次，处理刷新后非顶部的场景
  onScroll()
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))

// 供子页面（如首页快捷入口）触发 tab 切换
provide('navigate', navigate)
</script>

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

  <!-- 回到顶部：滚动超过一屏后悬浮于右下角 -->
  <transition name="backtop-fade">
    <button v-if="showBackTop" class="back-to-top" @click="backToTop" aria-label="回到顶部" title="回到顶部">
      ↑
    </button>
  </transition>
</template>

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
  color: var(--accent);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow: var(--shadow-md);
  transition: background var(--transition), transform 0.1s ease, opacity var(--transition);
}

/* 悬停与按下反馈 */
.back-to-top:hover {
  background: var(--bg-secondary);
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
    bottom: 66px;
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
}
</style>
