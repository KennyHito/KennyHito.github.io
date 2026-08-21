<!-- ===== Giscus 评论组件：动态注入 Giscus 脚本，跟随站点亮/暗主题切换 ===== -->
<template>
  <div ref="container" class="giscus-wrap">
    <!-- Giscus 脚本会在此容器内的 .giscus 节点中注入评论 iframe -->
    <div class="giscus"></div>
  </div>
</template>

<script setup>
// 引入 Vue 生命周期与监听器
import { ref, onMounted, onUnmounted, watch } from 'vue'
// 站点配置（Giscus 参数集中存放于 site.giscus）
import { site } from '../data/site.js'
// 全局主题（用于同步 Giscus 主题）
import { useTheme } from '../composables/useTheme.js'

// 可选：自定义讨论串标识（specific mapping 时使用）；默认站点级留言板
const props = defineProps({
  term: { type: String, default: '站点留言板' }
})
// 评论发布成功时向父组件（留言板页）发出事件，用于触发烟花
const emit = defineEmits(['commented'])

const container = ref(null)
const { theme } = useTheme()
const cfg = site.giscus || {}
// 重试计时器：iframe 尚未加载完成时轮询同步主题
let retryTimer = null
// 延迟确认计时器：postMessage 后二次确认主题已生效
let confirmTimer = null

// 根据配置与当前站点主题推导 Giscus 主题
function buildTheme() {
  // system = 跟随访客系统配色（preferred_color_scheme）；否则跟随站点明暗切换
  if (cfg.themeMode === 'system') {
    return 'preferred_color_scheme'
  }
  return theme.value === 'dark' ? 'dark' : 'light'
}

// 动态创建并注入 Giscus 脚本
function load() {
  // 缺少关键参数（repoId / categoryId）时静默跳过，避免在配置未就绪时报错
  if (!cfg.repo || !cfg.repoId || !cfg.categoryId) return
  const s = document.createElement('script')
  s.src = 'https://giscus.app/client.js'
  s.async = true
  s.crossOrigin = 'anonymous'
  s.setAttribute('data-repo', cfg.repo)
  s.setAttribute('data-repo-id', cfg.repoId)
  s.setAttribute('data-category', cfg.category || 'General')
  s.setAttribute('data-category-id', cfg.categoryId)
  const mapping = cfg.mapping || 'specific'
  s.setAttribute('data-mapping', mapping)
  // specific 映射需提供固定讨论串标识（优先配置项，其次组件入参）
  if (mapping === 'specific') {
    s.setAttribute('data-term', cfg.term || props.term)
  }
  s.setAttribute('data-strict', cfg.strict ?? '0')
  s.setAttribute('data-reactions-enabled', cfg.reactionsEnabled ?? '1')
  // 必须开启 emit-metadata：评论成功后 Giscus 会向父窗口 postMessage 含 discussion 的消息，
  // 用于在 MessageBoard 中触发烟花。关闭时父页面收不到任何讨论更新事件。
  s.setAttribute('data-emit-metadata', '1')
  s.setAttribute('data-input-position', cfg.inputPosition || 'bottom')
  s.setAttribute('data-theme', buildTheme())
  s.setAttribute('data-lang', cfg.lang || 'zh-CN')
  s.setAttribute('data-loading', 'lazy')
  // 标准做法：把脚本注入到 .giscus 容器内，确保 Giscus 能正确定位 iframe 挂载点
  const giscusEl = container.value.querySelector('.giscus')
  if (giscusEl) giscusEl.appendChild(s)
}

// 向 Giscus iframe 发送主题切换指令；iframe 未就绪时轮询重试
function updateTheme() {
  const iframe = document.querySelector('iframe.giscus-frame')
  // iframe 元素尚未注入，或 src 还没切到 giscus.app（仍处于 about:blank / 本地 dev 等中间态），
  // 都说明 Giscus 还没真正就绪，继续轮询即可，不要调用 postMessage。
  if (!iframe || !iframe.src || !iframe.src.startsWith('https://giscus.app')) {
    retryTimer = setTimeout(updateTheme, 300)
    return
  }
  try {
    const giscusTheme = buildTheme()
    // 同步 Giscus 内部主题
    iframe.contentWindow.postMessage(
      { giscus: { setConfig: { theme: giscusTheme, pollIntervalMs: 3000 } } },
      'https://giscus.app'
    )
    // 强制 iframe 的 color-scheme 与站点主题一致：防止系统级 UI
    // （滚动条、原生下拉、表情选择器等）在系统开暗色时自动变暗
    iframe.style.colorScheme = theme.value === 'dark' ? 'dark' : 'light'
    // 延迟二次确认：iframe 初始化期间首次 postMessage 可能未完全生效，
    // 600ms 后再发一次确保所有组件（reactions、评论头部等）都正确跟随主题
    if (confirmTimer) clearTimeout(confirmTimer)
    confirmTimer = setTimeout(() => {
      const reCheck = document.querySelector('iframe.giscus-frame')
      if (reCheck && reCheck.src && reCheck.src.startsWith('https://giscus.app')) {
        reCheck.contentWindow.postMessage(
          { giscus: { setConfig: { theme: buildTheme(), pollIntervalMs: 3000 } } },
          'https://giscus.app'
        )
      }
    }, 600)
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
  } catch (err) {
    // 极端情况下 postMessage 仍抛错（如 contentWindow origin 未就绪），捕获后继续轮询
    if (retryTimer) clearTimeout(retryTimer)
    retryTimer = setTimeout(updateTheme, 300)
  }
}

// 上一次记录到的评论总数。Giscus 在「初次加载讨论」和「评论成功」时都会发 discussion 消息，
// 数据结构完全相同，因此改用「评论数增量」判断：首次加载只记录基数，后续评论数增加才触发烟花。
let lastCommentCount = null

// 监听 Giscus iframe 向父窗口发送的消息。
// 仅接受 giscus.app 来源，避免误收页面内其它 postMessage。
function onGiscusMessage(event) {
  if (event.origin !== 'https://giscus.app') return
  const g = event.data?.giscus
  if (!g) return
  if (g.discussion) {
    const total = g.discussion.totalCommentCount ?? 0
    // 首次加载只记录基数，不触发烟花；后续评论数增加 = 新评论发布成功
    if (lastCommentCount !== null && total > lastCommentCount) {
      emit('commented')
    }
    lastCommentCount = total
  } else if (g.error) {
    console.warn('[Giscus] 评论出错：', g.error)
  }
}

// 组件挂载即加载评论；首次尝试同步主题（iframe 加载后由轮询补发）
onMounted(() => {
  window.addEventListener('message', onGiscusMessage)
  load()
  updateTheme()
})

// 卸载时清理监听器与重试计时器（Vue 会移除整个组件子树，含脚本与 iframe）
onUnmounted(() => {
  window.removeEventListener('message', onGiscusMessage)
  if (retryTimer) clearTimeout(retryTimer)
  if (confirmTimer) clearTimeout(confirmTimer)
})

// 站点主题切换时同步到评论区
watch(theme, () => updateTheme())

// 手动刷新评论：Giscus 非实时推送，切换 tab 不会自动更新，需用户主动触发。
// postMessage 的 refresh 指令在不同版本稳定性差，这里直接重建 Giscus 脚本，
// 清空旧 iframe 后重新加载，确保拉到最新评论（仅点击时触发，不影响切 tab 不重载）。
function refresh() {
  const el = container.value
  if (!el) return
  if (retryTimer) clearTimeout(retryTimer)
  if (confirmTimer) clearTimeout(confirmTimer)
  // 重置评论数基线：重建后重新记录基数，期间不会误触发烟花
  lastCommentCount = null
  // 移除已注入的 Giscus 脚本与评论 iframe
  el.querySelectorAll('script').forEach((s) => s.remove())
  const g = el.querySelector('.giscus')
  if (g) g.innerHTML = ''
  // 重新注入脚本，拉取最新评论
  load()
  updateTheme()
}

// 暴露 refresh 供父组件（留言板页）调用
defineExpose({ refresh })
</script>

<style scoped>
/* 评论容器：限制最大宽度、与页面风格一致的留白 */
.giscus-wrap {
  margin-top: 8px;
  min-height: 200px;
  /* 背景色跟随站点主题：iframe 加载前提供一致的视觉兜底，
     暗色主题下避免白底突兀；iframe 内部若有透明间隙也能被外层颜色覆盖 */
  background-color: var(--surface);
  border-radius: 12px;
  overflow: hidden;
  transition: background-color var(--transition);
}

/* Giscus 注入的 iframe 默认宽度 100%，此处无需额外处理。
   color-scheme 由 JS 在 updateTheme 中动态设为 light/dark，与站点主题按钮保持一致，
   避免系统暗色模式影响 iframe 内部的滚动条、表情选择器等系统/半系统 UI。 */
.giscus :deep(iframe) {
  width: 100%;
  border: none;
  /* 让 iframe 背景透明，使外层 .giscus-wrap 的背景色能透过来作为兜底 */
  background: transparent;
}
</style>
