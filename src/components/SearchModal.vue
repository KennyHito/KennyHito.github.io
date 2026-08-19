<!-- ===== 搜索弹窗 SearchModal：导航栏搜索入口，模糊搜索工具页内容 ===== -->
<template>
  <transition name="search-fade">
    <div v-if="open" class="search-overlay" @click.self="close" role="dialog" aria-modal="true"
      aria-label="搜索工具">
      <div class="search-modal">
        <!-- 搜索输入框 -->
        <div class="search-input-wrap">
          <AppIcon name="search" :size="18" class="search-input-icon" />
          <input ref="inputEl" v-model="query" type="text" class="search-input" :placeholder="placeholder"
            @keydown.esc="close" @keydown.down.prevent="moveActive(1)" @keydown.up.prevent="moveActive(-1)"
            @keydown.enter.prevent="chooseActive" />
          <button v-if="query" class="search-clear" @click="query = ''" aria-label="清空搜索内容">
            <AppIcon name="close" :size="14" />
          </button>
        </div>

        <!-- 结果列表 -->
        <div v-if="results.length" ref="resultsEl" class="search-results">
          <button v-for="(r, i) in results" :key="r.key" class="search-result"
            :class="{ active: i === activeIndex }" @click="goResult(r)" @mousemove="activeIndex = i">
            <span class="search-result-cat" :style="{ '--cat': r.color }">{{ r.category }}</span>
            <span class="search-result-main">
              <span class="search-result-name" v-html="highlight(r.name)"></span>
              <span class="search-result-desc">{{ r.desc }}</span>
            </span>
            <span class="search-result-action">{{ r.actionText }}</span>
          </button>
        </div>
        <!-- 空状态 -->
        <div v-else-if="query" class="search-empty">
          没有找到与「{{ query }}」相关的工具
        </div>
        <!-- 初始提示 -->
        <div v-else class="search-hint">
          输入关键词搜索工具（名称 / 简介 / 功能）
        </div>

        <!-- 底部快捷键提示 -->
        <div class="search-footer">
          <span class="search-footer-item">
            <kbd class="search-key">↩</kbd>
            <span>选择</span>
          </span>
          <span class="search-footer-item">
            <kbd class="search-key">↓</kbd>
            <kbd class="search-key">↑</kbd>
            <span>切换</span>
          </span>
          <span class="search-footer-item">
            <kbd class="search-key">esc</kbd>
            <span>关闭</span>
          </span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
// 引入 Vue 响应式 API 与 DOM 操作
import { ref, computed, watch, nextTick } from 'vue'
// 统一图标组件
import AppIcon from './AppIcon.vue'
// 工具页数据源（分类 + 工具），用于模糊搜索
import { toolCategories } from '../data/tools.js'

// 接收是否打开；向父级派发 close 事件关闭弹窗
const props = defineProps({
  open: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])

// 搜索关键词、键盘高亮项索引、输入框 DOM 引用、结果容器 DOM 引用
const query = ref('')
const activeIndex = ref(0)
const inputEl = ref(null)
const resultsEl = ref(null)

// 占位文案（随主题无需变化）
const placeholder = '搜索工具…'

// 把分类下的工具打平，并附上分类标题 / 颜色 / 跳转文案
const flatTools = toolCategories.flatMap((c) =>
  c.tools.map((t) => ({
    ...t,
    category: c.title,
    color: c.color,
    actionText: t.page ? '打开工具' : '外部链接'
  }))
)

/**
 * 模糊匹配（子序列）：查询字符按出现顺序全部命中目标文本即算匹配。
 * 比纯子串更宽松，支持“jv”（JSON 查看器）这类跳跃输入。
 */
function fuzzy(text, q) {
  text = text.toLowerCase()
  let i = 0
  for (const ch of text) {
    if (ch === q[i]) i++
    if (i === q.length) return true
  }
  return i === q.length
}

// 根据关键词过滤工具，结果附带截断后的简介
const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return flatTools
    .filter((t) => {
      const hay = [t.name, t.shortName, t.desc, (t.features || []).join(' ')]
        .join(' ')
        .toLowerCase()
      return fuzzy(hay, q)
    })
    .map((t) => ({
      ...t,
      desc: t.desc.length > 60 ? t.desc.slice(0, 60) + '…' : t.desc
    }))
})

// 结果变化后复位高亮项，并把第一项滚到可见区顶部
watch(results, () => {
  activeIndex.value = 0
  nextTick(scrollActiveIntoView)
})

// 键盘上下移动高亮项（循环），并让高亮项滚动进入可视区（避免被遮挡）
function moveActive(dir) {
  if (!results.value.length) return
  const n = results.value.length
  activeIndex.value = (activeIndex.value + dir + n) % n
  nextTick(scrollActiveIntoView)
}

// 将当前高亮项滚动到可视区：block:'nearest' 表示已在可见区就不滚动，超出才滚到刚好可见
function scrollActiveIntoView() {
  const container = resultsEl.value
  if (!container) return
  const items = container.querySelectorAll('.search-result')
  const el = items[activeIndex.value]
  if (el) el.scrollIntoView({ block: 'nearest' })
}

// 回车选择当前高亮项
function chooseActive() {
  const r = results.value[activeIndex.value]
  if (r) goResult(r)
}

// 点击结果：一律在新窗口打开（站内工具切 hash、外链开原链接），弹窗保持打开
function goResult(tool) {
  if (tool.page) {
    // 站内工具为 hash 路由，拼上当前页面基址后新窗口打开
    const base = window.location.href.split('#')[0]
    window.open(base + '#/tools/' + tool.page, '_blank', 'noopener')
  } else if (tool.link) {
    // 外链工具直接新窗口打开
    window.open(tool.link, '_blank', 'noopener')
  }
}

// 转义 HTML，避免注入
function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

// 高亮：仅对连续子串命中时加 <mark>，模糊跳跃命中时不强行高亮（避免错位）
function highlight(text) {
  const q = query.value.trim()
  if (!q) return escapeHtml(text)
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return escapeHtml(text)
  const before = escapeHtml(text.slice(0, idx))
  const hit = escapeHtml(text.slice(idx, idx + q.length))
  const after = escapeHtml(text.slice(idx + q.length))
  return `${before}<mark class="search-hl">${hit}</mark>${after}`
}

// 关闭弹窗并恢复背景滚动
function close() {
  emit('close')
}

// 打开时清空、聚焦、锁背景滚动；关闭时恢复
watch(
  () => props.open,
  (v) => {
    if (v) {
      query.value = ''
      activeIndex.value = 0
      document.body.classList.add('body--no-scroll')
      nextTick(() => {
        if (inputEl.value) inputEl.value.focus()
      })
    } else {
      document.body.classList.remove('body--no-scroll')
    }
  }
)
</script>

<style scoped>
/* ===== 搜索遮罩：覆盖全屏，点击空白关闭 ===== */
.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 14vh;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

/* 搜索弹窗主体：居中卡片 */
.search-modal {
  width: min(640px, calc(100% - 32px));
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

/* 输入框区域：图标 + 输入 + 清空 */
.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
}

.search-input-icon {
  color: var(--title);
  opacity: 0.55;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font: 400 17px/1 var(--font-sans);
  color: var(--text);
}

.search-input::placeholder {
  color: var(--text);
  opacity: 0.5;
}

/* 清空按钮 */
.search-clear {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--title);
  cursor: pointer;
  transition: background var(--transition), transform 0.1s ease;
}

.search-clear:hover {
  background: var(--border);
}

.search-clear:active {
  transform: scale(0.92);
}

/* 结果列表：可滚动，并作为统一网格容器，让所有结果行的三列跨行对齐；上下留 5px 避免紧贴边缘 */
.search-results {
  overflow-y: auto;
  padding: 5px 8px;
  display: grid;
  grid-template-columns: max-content 1fr max-content;
  align-items: center;
  gap: 0 12px;
}

/* 单条结果：继承父网格的三列轨（subgrid），第一列宽度取所有行最宽值 */
.search-result {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  transition: background var(--transition);
}

.search-result.active,
.search-result:hover {
  background: var(--bg-secondary);
}

/* 分类标签（左侧色条 + 文字）：max-content 列宽会取所有结果中最宽值，文字居中 */
.search-result-cat {
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  color: var(--cat);
  background: color-mix(in srgb, var(--cat) 14%, transparent);
  padding: 4px 9px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}

/* 名称 + 简介 */
.search-result-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.search-result-name {
  font-size: 15.5px;
  font-weight: 600;
  color: var(--title);
  /* 超出省略 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-result-desc {
  font-size: 13px;
  color: var(--text);
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 命中高亮 */
.search-hl {
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 3px;
  padding: 0 1px;
}

/* 右侧跳转文案 */
.search-result-action {
  font-size: 12.5px;
  color: var(--accent);
  opacity: 0.85;
}

/* 空状态 / 初始提示 */
.search-empty,
.search-hint {
  padding: 28px 18px;
  text-align: center;
  font-size: 14px;
  color: var(--text);
  opacity: 0.65;
}

/* 底部快捷键提示栏 */
.search-footer {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 18px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text);
  opacity: 0.65;
}

.search-footer-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 快捷键键帽 */
.search-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: var(--bg-secondary);
  font-family: var(--font-sans);
  font-size: 11px;
  line-height: 1;
  color: var(--title);
}

/* 弹窗淡入 + 轻微上移 */
.search-fade-enter-active,
.search-fade-leave-active {
  transition: opacity 0.18s ease;
}

.search-fade-enter-active .search-modal,
.search-fade-leave-active .search-modal {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
}

.search-fade-enter-from .search-modal,
.search-fade-leave-to .search-modal {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

/* 移动端：弹窗更贴边、顶部留白收窄 */
@media (max-width: 734px) {
  .search-overlay {
    padding-top: 10vh;
  }

  .search-modal {
    width: calc(100% - 24px);
  }
}
</style>
