<template>
  <!-- 根：工具栏 + 输入 + 预览（depth === 0 表示根节点，渲染完整页面布局） -->
  <div v-if="depth === 0" class="json-viewer json-viewer-root">
    <header>
      <h1><span class="logo">🧪</span> JSON 格式化查看器</h1>
      <!-- 顶部工具栏：文件 / 转换 / 格式化 / 展开收起 / 复制下载 / 搜索 -->
      <div class="toolbar">
        <label class="filebtn">📂 打开文件
          <input type="file" accept=".json,.txt,application/json" hidden @change="onFile" />
        </label>
        <button @click="toJsonString">转成JSON字符串</button>
        <button class="primary" @click="format">✨ 格式化</button>
        <button @click="expandAll">展开全部</button>
        <button @click="collapseAll">收起全部</button>
        <button @click="copyJson">📋 复制</button>
        <button @click="downloadJson">⬇️ 下载</button>
        <div class="search">
          🔍<input type="text" v-model="search" placeholder="搜索 key / 值" @input="doSearch" />
          <span class="count">{{ searchCount }}</span>
        </div>
      </div>
    </header>

    <main ref="mainRef">
      <section class="editor" :style="paneStyle">
        <div class="pane-title">
          <span>输入 JSON</span>
          <span>
            <span class="link" @click="loadSample">载入示例</span>
            &nbsp;·&nbsp;
            <span class="link" @click="clearAll">清空</span>
          </span>
        </div>
        <textarea v-model="raw" spellcheck="false" placeholder="在此粘贴 JSON，或点击「打开文件」/「载入示例」…"
          @keydown.ctrl.enter="format" @keydown.meta.enter="format"></textarea>
      </section>

      <div class="resizer" :class="{ dragging: resizing }" @pointerdown="startResize"></div>

      <section class="preview">
        <div class="pane-title"><span>格式化视图</span><span class="meta">{{ statInfo }}</span></div>
        <div class="preview-scroll">
          <div v-if="!parsed && !error" class="empty-hint">左侧输入 JSON 后，点击「格式化」即可查看结构化视图</div>
          <div v-else-if="error" class="empty-hint" style="color: var(--error)">❌ {{ error }}</div>
          <div v-else class="json-tree">
            <JsonViewer :data="parsed" :depth="1" />
          </div>
        </div>
      </section>
    </main>

    <div class="status-bar" :class="{ error: !!error }">{{ status }}</div>
  </div>

  <!-- 子节点：递归渲染 -->
  <div v-else class="node-block">
    <div class="node-row" :class="{ match: isMatch }">
      <span class="toggle" :class="{ collapsed: isCollapsed, leaf: !isObject }" @click="isObject && toggleSelf()">{{
        isObject ? (isCollapsed ? '▶' : '▼') : '▶' }}</span>
      <span v-if="nodeName !== undefined" class="key">{{ nodeName }}</span><span v-if="nodeName !== undefined"
        class="colon">: </span>
      <template v-if="isObject">
        <span class="bracket">{{ isArray ? '[' : '{' }}</span>
        <span class="meta"> {{ childCount }} {{ isArray ? '项' : '键' }} </span>
      </template>
      <template v-else>
        <span class="value-wrap">
          <span :class="valueClass">{{ displayValue }}</span><span v-if="!isLast" class="meta">,</span>
        </span>
      </template>
    </div>

    <div v-if="isObject && !isCollapsed" class="children">
      <JsonViewer v-for="(child, i) in entries" :key="i" :data="child.value" :name="isArray ? undefined : child.key"
        :is-last="i === entries.length - 1" :depth="depth + 1" />
      <div class="node-row">
        <span class="toggle leaf">▶</span>
        <span class="bracket">{{ closeBracket }}</span><span v-if="!isLast" class="meta">,</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, provide, inject, onMounted, onUnmounted, defineProps, defineOptions } from 'vue'

// 显式声明组件名（递归自引用 <JsonViewer> 时依赖该名称）
defineOptions({ name: 'JsonViewer' })

// 递归组件 props：
// - data   ：当前节点的数据值（对象/数组/原始值）
// - name   ：对象节点时显示的 key 名（数组节点为 undefined，仅显示索引）
// - isLast ：是否为父级最后一个子节点（决定末尾是否显示逗号）
// - depth  ：节点深度，0 表示根节点（渲染完整页面），>0 渲染树节点
const props = defineProps({
  data: { default: undefined },
  name: { type: [String, Number], default: undefined },
  isLast: { type: Boolean, default: true },
  depth: { type: Number, default: 0 }
})

// 示例数据：初始载入及「载入示例」按钮使用
const SAMPLE = {
  "name": "测试示例",
  "id": 1001,
  "enable": true,
  "tags": ["demo", "simple"],
  "info": {
    "createTime": "2026-08-14",
    "remark": "简单JSON样例"
  }
}

/* ---------- 共享状态（仅根提供，子节点注入） ---------- */
let store
if (props.depth === 0) {
  store = reactive({ search: '', force: 'none' }) // force: 'none' | 'expand' | 'collapse'
  provide('store', store)
} else {
  store = inject('store')
}

/* ---------- 节点计算属性 ---------- */
const nodeName = computed(() => props.name)
const isObject = computed(() => props.data !== null && typeof props.data === 'object')
const isArray = computed(() => Array.isArray(props.data))
const closeBracket = computed(() => (isArray.value ? ']' : '}'))

// 子节点列表：对象取 [key, value] 对，数组按索引展开（key 传 undefined 表示只显示索引）
const entries = computed(() => {
  if (!isObject.value) return []
  const src = isArray.value ? props.data : Object.entries(props.data)
  return src.map((pair, i) => {
    const [k, v] = isArray.value ? [i, pair] : pair
    return { key: k, value: v }
  })
})
const childCount = computed(() => entries.value.length)

// 原始值的展示文本：字符串补引号，其余直接转字符串
const displayValue = computed(() => {
  const v = props.data
  if (v === null) return 'null'
  if (typeof v === 'string') return '"' + v + '"'
  return String(v)
})
// 原始值的语法高亮类名（键名/字符串/数字/布尔/null 分别着色）
const valueClass = computed(() => {
  const v = props.data
  if (v === null) return 'val-null'
  if (typeof v === 'string') return 'val-string'
  if (typeof v === 'number') return 'val-number'
  if (typeof v === 'boolean') return 'val-boolean'
  return ''
})

// 折叠状态：局部状态 localCollapsed 与全局指令 store.force（展开全部/收起全部/搜索）叠加
const localCollapsed = ref(false)
const isCollapsed = computed(() => {
  if (store.force === 'expand') return false
  if (store.force === 'collapse') return isObject.value
  return localCollapsed.value
})
// 手动点击节点切换折叠：先清除全局展开/收起指令，再翻转局部状态
function toggleSelf() {
  store.force = 'none'
  localCollapsed.value = !localCollapsed.value
}

const isMatch = computed(() => {
  const q = (store.search || '').trim().toLowerCase()
  if (!q) return false
  // 只匹配自身 key 或自身原始值，不把子孙内容算进去，避免父级被连带高亮
  const nameHit = props.name !== undefined && String(props.name).toLowerCase().includes(q)
  const valueHit = !isObject.value && JSON.stringify(props.data).toLowerCase().includes(q)
  return nameHit || valueHit
})

/* ---------- 根专属状态与逻辑 ---------- */
const raw = ref(JSON.stringify(SAMPLE, null, 2))
const parsed = ref(null)
const error = ref('')
const status = ref('就绪')
const statInfo = ref('')
const search = ref('')
const searchCount = ref('')

/* ---------- 拖拽分割（桌面左右 / 移动上下） ---------- */
const mainRef = ref(null)
const leftWidth = ref(50)   // 桌面端：左侧输入面板宽度百分比
const topHeight = ref(50)   // 移动端：上方输入区高度百分比（默认 50%，保持与预览区默认等高）
const resizing = ref(false)

// 输入面板内联尺寸：同时输出 width/height，桌面用 width、移动用 height，另一项由 CSS 忽略
// 高度 -7px：为中间拖拽条让位，保证默认时输入区/预览区严格各占一半
const paneStyle = computed(() => ({
  width: leftWidth.value + '%',
  height: 'calc(' + topHeight.value + '% - 7px)'
}))

// 当前拖拽方向：'x' 桌面左右、'y' 移动上下，按触发时窗口宽度实时决定
let resizeDir = 'x'

// 拖拽中：按 resizeDir 更新宽度或高度，均限制在 20% ~ 80%
// 使用 Pointer Events 统一处理鼠标与触摸（PointerEvent 同样含 clientX/clientY）
function onResize(e) {
  if (!resizing.value || !mainRef.value) return
  const rect = mainRef.value.getBoundingClientRect()
  if (resizeDir === 'y') {
    let pct = ((e.clientY - rect.top) / rect.height) * 100
    topHeight.value = Math.min(80, Math.max(20, pct))
  } else {
    let pct = ((e.clientX - rect.left) / rect.width) * 100
    leftWidth.value = Math.min(80, Math.max(20, pct))
  }
}
// 开始拖拽：锁定全局选中（防拖拽时选中文本），注册全局指针监听
// 配合 CSS touch-action:none，手机端拖拽不会被浏览器滚动抢走
function startResize(e) {
  resizing.value = true
  resizeDir = window.innerWidth <= 760 ? 'y' : 'x'
  document.body.style.userSelect = 'none'
  document.addEventListener('pointermove', onResize)
  document.addEventListener('pointerup', stopResize)
  document.addEventListener('pointercancel', stopResize)
  e.preventDefault()
}
// 结束拖拽：恢复选中，移除全局监听
function stopResize() {
  resizing.value = false
  document.body.style.userSelect = ''
  document.removeEventListener('pointermove', onResize)
  document.removeEventListener('pointerup', stopResize)
  document.removeEventListener('pointercancel', stopResize)
}

// 统计节点总数与根类型，展示在预览面板标题栏（如「对象 · 节点 12」）
function countStats(data) {
  let nodes = 0
  const walk = (v) => {
    nodes++
    if (v !== null && typeof v === 'object') {
      const arr = Array.isArray(v) ? v : Object.values(v)
      arr.forEach(walk)
    }
  }
  walk(data)
  const type = Array.isArray(data) ? '数组' : (data && typeof data === 'object' ? '对象' : typeof data)
  statInfo.value = `${type} · 节点 ${nodes}`
}

/* 宽松 JSON 标准化：补 key 引号、单引号转双引号、去尾随逗号（不破坏字符串内容） */
function normalizeJson(text) {
  const store = []
  // 1. 抽取字符串字面量（单/双引号、含转义）为占位符，单引号在此转双引号
  let s = text.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, (m) => {
    let out = m
    if (m[0] === "'") {
      const inner = m.slice(1, -1).replace(/\\'/g, "'").replace(/"/g, '\\"')
      out = '"' + inner + '"'
    }
    store.push(out)
    return '@@' + (store.length - 1) + '@@'
  })
  // 2. 给未加引号的 key（标识符）补引号，仅匹配 { 或 , 之后的 key
  s = s.replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*(:)/g, '$1"$2"$3')
  // 3. 去掉尾随逗号
  s = s.replace(/,(\s*[}\]])/g, '$1')
  // 4. 还原字符串
  s = s.replace(/@@(\d+)@@/g, (m, i) => store[Number(i)])
  return s
}

// 解析输入文本：优先严格 JSON.parse，失败则走宽松标准化（补 key 引号/去尾逗号）再解析
// 返回解析结果；解析失败时返回 null 并设置 error/status
function parseInput(t) {
  try {
    return { ok: true, data: JSON.parse(t) }
  } catch (e1) {
    try {
      return { ok: true, data: JSON.parse(normalizeJson(t)), loose: true }
    } catch (e2) {
      error.value = e2.message
      status.value = 'JSON 解析失败：' + e2.message
      return { ok: false }
    }
  }
}

// 格式化：解析后按 2 空格缩进美化，更新视图并统计
function format() {
  const t = raw.value.trim()
  if (!t) { error.value = '请输入 JSON 内容'; parsed.value = null; return }
  const r = parseInput(t)
  if (!r.ok) return
  parsed.value = r.data
  raw.value = JSON.stringify(r.data, null, 2)
  error.value = ''
  status.value = (r.loose ? '已按宽松格式（无引号 key）解析 ✓ ' : '格式化成功 ✓ ') + new Date().toLocaleTimeString()
  applyResult(r.data)
}

// 转成 JSON 字符串：解析后压缩为单行（不带缩进）
function toJsonString() {
  const t = raw.value.trim()
  if (!t) { error.value = '请输入 JSON 内容'; parsed.value = null; return }
  const r = parseInput(t)
  if (!r.ok) return
  parsed.value = r.data
  raw.value = JSON.stringify(r.data)
  error.value = ''
  status.value = (r.loose ? '已按宽松格式解析并转为字符串 ✓ ' : '已转为 JSON 字符串 ✓ ') + new Date().toLocaleTimeString()
  applyResult(r.data)
}

// 解析成功后的公共收尾：统计节点、清空搜索状态
function applyResult(data) {
  countStats(data)
  search.value = ''
  searchCount.value = ''
  store.search = ''
  store.force = 'none'
}

// 深度遍历统计匹配次数：key 命中或叶子节点的值命中均计数
function countMatches(data, q) {
  let n = 0
  const walk = (key, v) => {
    const nameHit = key !== undefined && String(key).toLowerCase().includes(q)
    const valueHit = (v === null || typeof v !== 'object') && JSON.stringify(v).toLowerCase().includes(q)
    if (nameHit || valueHit) n++
    if (v !== null && typeof v === 'object') {
      const arr = Array.isArray(v) ? v : Object.entries(v)
      arr.forEach((pair) => {
        const [k, val] = Array.isArray(v) ? [undefined, pair] : pair
        walk(k, val)
      })
    }
  }
  walk(undefined, data)
  return n
}

// 搜索输入：空关键词恢复原状；有关键词则全局展开并统计命中数
function doSearch() {
  if (!parsed.value) return
  const q = search.value.trim().toLowerCase()
  store.search = search.value
  if (q) {
    store.force = 'expand' // 展开以便看到匹配
    const hits = countMatches(parsed.value, q)
    searchCount.value = hits + ' 命中'
    status.value = '找到 ' + hits + ' 处匹配'
  } else {
    store.force = 'none'
    searchCount.value = ''
  }
}

// 展开全部 / 收起全部：通过 store.force 全局指令驱动所有节点
function expandAll() { store.force = 'expand'; search.value = ''; store.search = ''; searchCount.value = '' }
function collapseAll() { store.force = 'collapse' }

// 复制：将格式化后的 JSON 写入剪贴板，成功/失败均更新状态栏
// 优先使用 Clipboard API，不支持的旧浏览器/非 HTTPS 环境降级到 execCommand
function fallbackCopy(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.top = '-9999px'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  ta.setSelectionRange(0, text.length)
  const ok = document.execCommand('copy')
  document.body.removeChild(ta)
  return ok
}

async function copyJson() {
  if (parsed.value === null) { status.value = '没有可复制的内容'; return }
  const text = JSON.stringify(parsed.value, null, 2)
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
  status.value = ok ? '复制成功 ✓ ' + new Date().toLocaleTimeString() : '复制失败，请手动选择'
}

// 下载：把格式化结果生成 Blob 并触发 <a> 下载 data.json
function downloadJson() {
  if (parsed.value === null) { status.value = '没有可下载的内容'; return }
  const text = JSON.stringify(parsed.value, null, 2)
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'data.json'
  a.click()
  URL.revokeObjectURL(url) // 释放 Blob URL，避免内存泄漏
  status.value = '已下载 data.json ✓'
}

// 载入示例：填入示例数据后直接格式化
function loadSample() { raw.value = JSON.stringify(SAMPLE, null, 2); format() }

// 清空：重置输入、解析结果与所有状态
function clearAll() {
  raw.value = ''
  parsed.value = null
  error.value = ''
  statInfo.value = ''
  search.value = ''
  searchCount.value = ''
  status.value = '已清空'
}

// 打开本地 JSON 文件：FileReader 读取文本后直接格式化
function onFile(e) {
  const f = e.target.files[0]
  if (!f) return
  const r = new FileReader()
  r.onload = () => { raw.value = r.result; format() }
  r.readAsText(f)
}

/* 根组件初始化 */
if (props.depth === 0) {
  format()
  // 独立工具模式：隐藏站点全局导航栏 / 页脚 / 返回顶部按钮，聚焦工具本身
  onMounted(() => document.body.classList.add('tool-standalone'))
  onUnmounted(() => document.body.classList.remove('tool-standalone'))
}
</script>

<style>
/* CSS 变量必须放在非 scoped 块中，否则 :root 选择器会被 Vue 加上 data 属性导致变量失效 */
.json-viewer-root {
  --bg: #f5f7fa;
  --panel: #ffffff;
  --border: #e3e8ef;
  --text: #1f2933;
  --muted: #7b8794;
  --accent: #2f6fed;
  --accent-soft: #e8f0fe;
  --key: #2f6fed;
  --string: #1a7f37;
  --number: #b45309;
  --boolean: #9333ea;
  --null: #dc2626;
  --bracket: #52606d;
  --hover: #f0f4ff;
  --error: #dc2626;
}
</style>

<style scoped>
.json-viewer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  /* 移动端地址栏收起时也占满可视区，避免出现整页滚动 */
  overflow: hidden;
  /* 页面整体固定，只允许面板内部滚动 */
  /* 阻止滚动链与橡皮筋：面板内部滚动到底/顶时不再带动外层页面 */
  overscroll-behavior: none;
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
}

header {
  padding: 14px 20px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

header h1 {
  font-size: 16px;
  margin: 0;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  font-size: 18px;
}

.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-left: auto;
}

button,
.filebtn {
  font: inherit;
  font-size: 13px;
  padding: 7px 13px;
  border: 1px solid var(--border);
  background: var(--panel);
  border-radius: 7px;
  cursor: pointer;
  color: var(--text);
  transition: all .15s;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

button:hover,
.filebtn:hover {
  background: var(--accent-soft);
  border-color: var(--accent);
}

button.primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

button.primary:hover {
  background: #2459c9;
}

.search {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 5px 10px;
  background: var(--panel);
}

.search input {
  border: none;
  outline: none;
  font: inherit;
  font-size: 13px;
  width: 160px;
  background: transparent;
  color: var(--text);
}

.search .count {
  font-size: 12px;
  color: var(--muted);
  min-width: 38px;
  text-align: right;
}

main {
  flex: 1;
  display: flex;
  overflow: hidden;
  /* 允许收缩，防止面板内容超高把整页撑出滚动 */
  min-height: 0;
}

.editor,
.preview {
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor {
  flex: none;
  width: 50%;
  border-right: none;
}

/* 桌面端忽略内联 height（paneStyle 同时输出 width/height，桌面只用 width） */
@media (min-width: 761px) {
  .editor {
    height: auto !important;
  }
}

.preview {
  flex: 1 1 0;
}

.resizer {
  width: 5px;
  flex: 0 0 5px;
  cursor: col-resize;
  background: var(--border);
  transition: background .15s;
  /* 禁止浏览器接管该元素手势（滚动/缩放），保证指针拖动持续触发 */
  touch-action: none;
}

.resizer:hover,
.resizer.dragging {
  background: var(--accent);
}

.pane-title {
  font-size: 12px;
  color: var(--muted);
  padding: 8px 16px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

textarea {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  padding: 16px;
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
  background: var(--panel);
  /* 内部滚动到底/顶时不带动外层页面 */
  overscroll-behavior: contain;
}

.preview-scroll {
  flex: 1;
  overflow: auto;
  padding: 12px 16px;
  background: var(--panel);
  overscroll-behavior: contain;
}

.status-bar {
  padding: 6px 16px;
  font-size: 12px;
  background: var(--panel);
  border-top: 1px solid var(--border);
  color: var(--muted);
}

.status-bar.error {
  color: var(--error);
}

/* 树形 */
.json-tree {
  font-family: var(--font-sans);
  font-size: 13px;
}

.node-block {
  display: block;
}

.node-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 5px;
  line-height: 1.7;
  font-family: var(--font-sans);
  font-size: 13px;
}

.node-row:hover {
  background: var(--hover);
}

.toggle {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  user-select: none;
  transition: transform .15s;
  font-size: 11px;
}

.toggle.collapsed {
  transform: rotate(-90deg);
}

.toggle.leaf {
  visibility: hidden;
}

.children {
  padding-left: 20px;
  border-left: 1px dashed var(--border);
  margin-left: 6px;
}

.key {
  color: var(--key);
}

.colon {
  color: var(--muted);
}

.val-string {
  color: var(--string);
  word-break: break-all;
  white-space: pre-wrap;
}

.value-wrap {
  display: inline;
}

.val-number {
  color: var(--number);
}

.val-boolean {
  color: var(--boolean);
  font-weight: 600;
}

.val-null {
  color: var(--null);
  font-style: italic;
}

.bracket {
  color: var(--bracket);
}

.meta {
  color: var(--muted);
  font-size: 12px;
  user-select: none;
}

.empty-hint {
  color: var(--muted);
  text-align: center;
  margin-top: 40px;
  font-size: 14px;
}

.node-row.match {
  background: #fff3bf;
}

.node-row.match:hover {
  background: #ffe066;
}

.link {
  color: var(--accent);
  cursor: pointer;
  font-size: 12px;
}

.link:hover {
  text-decoration: underline;
}

@media (max-width: 760px) {
  .json-viewer {
    /* 固定定位替代 100vh：企微等内置浏览器地址栏收起/展开时高度不再抖动，
       也不会因 vh 计算误差出现整页滚动 */
    position: fixed;
    inset: 0;
    height: auto;
    overscroll-behavior: none;
  }

  main {
    flex-direction: column;
  }

  .editor {
    border-right: none;
    border-bottom: 1px solid var(--border);
    /* 覆盖内联 width（leftWidth%）的优先级，移动端输入区占满屏幕宽度 */
    width: 100% !important;
    /* 高度由内联 style 控制（topHeight%），不参与 flex 伸缩 */
    flex: none;
    min-height: 0;
  }

  .preview {
    /* 占据拖拽条以下的剩余高度 */
    flex: 1 1 0;
    min-height: 0;
  }

  .resizer {
    /* 移动端水平拖拽条：上下拖动调整输入区/预览区高度 */
    display: block;
    width: 100%;
    height: 14px;
    flex: 0 0 14px;
    cursor: row-resize;
    touch-action: none;
  }
}
</style>
