<template>
  <!-- 根：工具栏 + 输入 + 预览 -->
  <div v-if="depth === 0" class="json-viewer json-viewer-root">
    <header>
      <h1><span class="logo">🧪</span> JSON 格式化查看器</h1>
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
      <section class="editor" :style="{ width: leftWidth + '%' }">
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

      <div class="resizer" :class="{ dragging: resizing }" @mousedown="startResize"></div>

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

defineOptions({ name: 'JsonViewer' })

const props = defineProps({
  data: { default: undefined },
  name: { type: [String, Number], default: undefined },
  isLast: { type: Boolean, default: true },
  depth: { type: Number, default: 0 }
})

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

const entries = computed(() => {
  if (!isObject.value) return []
  const src = isArray.value ? props.data : Object.entries(props.data)
  return src.map((pair, i) => {
    const [k, v] = isArray.value ? [i, pair] : pair
    return { key: k, value: v }
  })
})
const childCount = computed(() => entries.value.length)

const displayValue = computed(() => {
  const v = props.data
  if (v === null) return 'null'
  if (typeof v === 'string') return '"' + v + '"'
  return String(v)
})
const valueClass = computed(() => {
  const v = props.data
  if (v === null) return 'val-null'
  if (typeof v === 'string') return 'val-string'
  if (typeof v === 'number') return 'val-number'
  if (typeof v === 'boolean') return 'val-boolean'
  return ''
})

const localCollapsed = ref(false)
const isCollapsed = computed(() => {
  if (store.force === 'expand') return false
  if (store.force === 'collapse') return isObject.value
  return localCollapsed.value
})
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

/* ---------- 左右拖拽分割 ---------- */
const mainRef = ref(null)
const leftWidth = ref(50)
const resizing = ref(false)

function onResize(e) {
  if (!resizing.value || !mainRef.value) return
  const rect = mainRef.value.getBoundingClientRect()
  let pct = ((e.clientX - rect.left) / rect.width) * 100
  pct = Math.min(80, Math.max(20, pct))
  leftWidth.value = pct
}
function startResize(e) {
  resizing.value = true
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  e.preventDefault()
}
function stopResize() {
  resizing.value = false
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

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

function format() {
  const t = raw.value.trim()
  if (!t) { error.value = '请输入 JSON 内容'; parsed.value = null; return }
  let p
  try {
    p = JSON.parse(t)
  } catch (e1) {
    // 严格解析失败 → 尝试宽松标准化后再解析
    try {
      p = JSON.parse(normalizeJson(t))
      status.value = '已按宽松格式（无引号 key）解析 ✓ ' + new Date().toLocaleTimeString()
    } catch (e2) {
      error.value = e2.message
      status.value = 'JSON 解析失败：' + e2.message
      return
    }
  }
  parsed.value = p
  raw.value = JSON.stringify(p, null, 2)
  error.value = ''
  if (!status.value.startsWith('已按宽松')) status.value = '格式化成功 ✓ ' + new Date().toLocaleTimeString()
  countStats(p)
  search.value = ''
  searchCount.value = ''
  store.search = ''
  store.force = 'none'
}

function toJsonString() {
  const t = raw.value.trim()
  if (!t) { error.value = '请输入 JSON 内容'; parsed.value = null; return }
  let p
  try {
    p = JSON.parse(t)
  } catch (e1) {
    try {
      p = JSON.parse(normalizeJson(t))
      status.value = '已按宽松格式解析并转为字符串 ✓ ' + new Date().toLocaleTimeString()
    } catch (e2) {
      error.value = e2.message
      status.value = 'JSON 解析失败：' + e2.message
      return
    }
  }
  parsed.value = p
  raw.value = JSON.stringify(p) // 压缩成单行字符串
  error.value = ''
  if (!status.value.startsWith('已按宽松')) status.value = '已转为 JSON 字符串 ✓ ' + new Date().toLocaleTimeString()
  countStats(p)
  search.value = ''
  searchCount.value = ''
  store.search = ''
  store.force = 'none'
}

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

function doSearch() {
  if (!parsed.value) return
  const q = search.value.trim().toLowerCase()
  store.search = search.value
  if (q) {
    store.force = 'expand' // 展开以便看到匹配
    searchCount.value = countMatches(parsed.value, q) + ' 命中'
    status.value = '找到 ' + countMatches(parsed.value, q) + ' 处匹配'
  } else {
    store.force = 'none'
    searchCount.value = ''
  }
}

function expandAll() { store.force = 'expand'; search.value = ''; store.search = ''; searchCount.value = '' }
function collapseAll() { store.force = 'collapse' }

function copyJson() {
  if (parsed.value === null) { status.value = '没有可复制的内容'; return }
  const text = JSON.stringify(parsed.value, null, 2)
  navigator.clipboard.writeText(text).then(
    () => (status.value = '已复制到剪贴板 ✓'),
    () => (status.value = '复制失败，请手动选择')
  )
}

function downloadJson() {
  if (parsed.value === null) { status.value = '没有可下载的内容'; return }
  const text = JSON.stringify(parsed.value, null, 2)
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'data.json'
  a.click()
  URL.revokeObjectURL(url)
  status.value = '已下载 data.json ✓'
}

function loadSample() { raw.value = JSON.stringify(SAMPLE, null, 2); format() }
function clearAll() {
  raw.value = ''
  parsed.value = null
  error.value = ''
  statInfo.value = ''
  search.value = ''
  searchCount.value = ''
  status.value = '已清空'
}

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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
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

.preview {
  flex: 1 1 0;
}

.resizer {
  width: 5px;
  flex: 0 0 5px;
  cursor: col-resize;
  background: var(--border);
  transition: background .15s;
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
  font-family: "SF Mono", "Fira Code", Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
  background: var(--panel);
}

.preview-scroll {
  flex: 1;
  overflow: auto;
  padding: 12px 16px;
  background: var(--panel);
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
  font-family: "SF Mono", "Fira Code", Consolas, monospace;
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
  font-family: "SF Mono", "Fira Code", Consolas, monospace;
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
  main {
    flex-direction: column;
  }

  .editor {
    border-right: none;
    border-bottom: 1px solid var(--border);
    width: auto;
    flex: 1;
  }

  .preview {
    flex: 1;
  }

  .resizer {
    display: none;
  }
}
</style>
