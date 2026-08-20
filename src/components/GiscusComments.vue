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

const container = ref(null)
const { theme } = useTheme()
const cfg = site.giscus || {}
// 重试计时器：iframe 尚未加载完成时轮询同步主题
let retryTimer = null
// 上一次 discussion 的评论数，用于检测新增评论（首次收到时不触发通知）
let lastCommentCount = null

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
  s.setAttribute('data-emit-metadata', cfg.emitMetadata ?? '0')
  s.setAttribute('data-input-position', cfg.inputPosition || 'bottom')
  s.setAttribute('data-theme', buildTheme())
  s.setAttribute('data-lang', cfg.lang || 'zh-CN')
  s.setAttribute('data-loading', 'lazy')
  container.value.appendChild(s)
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
    iframe.contentWindow.postMessage(
      { giscus: { setConfig: { theme: buildTheme(), pollIntervalMs: 3000 } } },
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

// 监听 Giscus 跨域消息：
// Giscus 官方只向父页面推送 error / discussion / resizeHeight / signOut 四类消息，
// **没有 reply 事件**——不要监听 g.reply，它永远不会触发。discussion 元数据
// （需 emitMetadata=1）包含评论总数，评论数增加时视为有新评论，触发飞书通知。
// 注意：纯前端拿不到单条评论的作者与内容，只能拿到「评论数变化」。
function onGiscusMessage(e) {
  // 仅接受 giscus.app 来源，避免误收页面内其它 postMessage
  if (e.origin !== 'https://giscus.app') return
  const g = e.data?.giscus
  if (!g) return
  if (g.discussion) {
    const total = g.discussion.totalCommentCount ?? 0
    // 首次加载只记录基数，不触发通知；后续评论数增加才通知
    if (lastCommentCount !== null && total > lastCommentCount) {
      console.log('[Giscus] 评论数增加，触发飞书通知：', g)
      notifyFeishu(g)
    }
    lastCommentCount = total
  } else if (g.error) {
    console.warn('[Giscus] 评论出错：', g.error)
  }
}

// 向飞书机器人推送「新评论提醒」通知（纯前端 fetch，飞书 webhook 已开放 CORS）
async function notifyFeishu(g) {
  const hook = site.notify?.feishuWebhook
  if (!hook) return
  // 从 site.devnote（如 https://devnote.site）解析出域名（devnote.site），避免文案硬编码
  const domain = new URL(site.devnote).hostname
  // 通知模板：站点名 + 一句话提醒 + 讨论链接（飞书自动将 URL 渲染为可点击链接）
  const text = '网友：' + g.viewer.login + '，发表新的评论/回复，点击' + domain + '前往查看！'
  try {
    await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msg_type: 'text', content: { text } })
    })
  } catch (err) {
    // 通知失败不影响评论本身，仅记录到控制台
    console.warn('[Feishu] 留言通知推送失败：', err)
  }
}

// 组件挂载即加载评论；首次尝试同步主题（iframe 加载后由轮询补发）
onMounted(() => {
  load()
  updateTheme()
  // 监听 Giscus 推送的跨域消息，捕获评论成功事件以触发飞书通知
  window.addEventListener('message', onGiscusMessage)
})

// 卸载时清理重试计时器与消息监听（Vue 会移除整个组件子树，含脚本与 iframe）
onUnmounted(() => {
  if (retryTimer) clearTimeout(retryTimer)
  window.removeEventListener('message', onGiscusMessage)
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
}

/* Giscus 注入的 iframe 默认宽度 100%，此处无需额外处理 */
.giscus :deep(iframe) {
  width: 100%;
  border: none;
  color-scheme: normal;
}
</style>
