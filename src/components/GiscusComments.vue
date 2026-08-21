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
  container.value.appendChild(s)
}

// 同步 Giscus 主题到 iframe；iframe 未就绪时轮询重试。
// 关键：iframe 元素一旦出现，就立即强制其 color-scheme —— iframe 元素上的 color-scheme
// 会传播到 iframe 内部文档，覆盖 Giscus 自带的 <meta name="color-scheme" content="light dark">，
// 从而让滚动条、输入框、表情选择器等原生 UI 严格跟随网站主题开关，而不是跟随手机系统配色。
function updateTheme() {
  const iframe = document.querySelector('iframe.giscus-frame')
  // iframe 元素只要存在即可设置 color-scheme（元素属性，无需等 src 就绪）
  if (iframe) {
    iframe.style.colorScheme = theme.value === 'dark' ? 'dark' : 'light'
  }
  // src 还没切到 giscus.app（仍处于 about:blank / 本地 dev 等中间态）说明 Giscus
  // 尚未真正就绪，继续轮询，此时不要 postMessage（contentWindow origin 不对会抛错）。
  if (!iframe || !iframe.src || !iframe.src.startsWith('https://giscus.app')) {
    retryTimer = setTimeout(updateTheme, 300)
    return
  }
  try {
    const giscusTheme = buildTheme()
    // postMessage 动态同步内部主题（与 data-theme 双保险，供重建后微调使用）
    iframe.contentWindow.postMessage(
      { giscus: { setConfig: { theme: giscusTheme, pollIntervalMs: 3000 } } },
      'https://giscus.app'
    )
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
  if (themeRebuildTimer) clearTimeout(themeRebuildTimer)
})

// 站点主题切换时重建评论 iframe：Giscus 的 postMessage 动态切主题在 iOS Safari 上不可靠
// （部分组件不重绘、残留旧主题底色，表现为白底/灰字混合），重建让 iframe 从加载起就
// 携带正确的 data-theme 渲染，所有组件（含表情反应栏）一次性到位。300ms 防抖合并快速连点。
let themeRebuildTimer = null
watch(theme, () => {
  clearTimeout(themeRebuildTimer)
  themeRebuildTimer = setTimeout(refresh, 300)
})

// 手动刷新评论：Giscus 非实时推送，切换 tab 不会自动更新，需用户主动触发。
// postMessage 的 refresh 指令在不同版本稳定性差，这里直接重建 Giscus 脚本，
// 清空旧 iframe 后重新加载，确保拉到最新评论（仅点击时触发，不影响切 tab 不重载）。
function refresh() {
  const el = container.value
  if (!el) return
  if (retryTimer) clearTimeout(retryTimer)
  if (themeRebuildTimer) clearTimeout(themeRebuildTimer)
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
/* 评论容器：与站点主题一致的背景 + 圆角。
   兜底作用：iframe 加载前、主题切换重建期间、或 iframe 内部任何渲染异常时，
   容器背景始终保持与主题一致（暗色下为深色而非白色），杜绝白底突兀。 */
.giscus-wrap {
  margin-top: 8px;
  min-height: 200px;
  background: var(--surface);
  border-radius: 12px;
  overflow: hidden;
}

/* Giscus 注入的 iframe 默认宽度 100%。
   iframe 背景透明：让外层 .giscus-wrap 的主题背景能透过去，覆盖任何内部异常白底。
   color-scheme 由 JS 在 updateTheme 中动态设为 light/dark（iframe 元素 color-scheme
   会传播到内部文档，覆盖其 <meta name="color-scheme">），强制原生 UI 跟随网站主题开关，
   而不是跟随手机系统配色。 */
.giscus :deep(iframe) {
  width: 100%;
  border: none;
  background: transparent;
}
</style>
