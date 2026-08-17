<!-- ===== 工具页：文件对比（Diff） ===== -->
<template>
  <div class="file-diff">
    <!-- 顶栏：标题 + 操作按钮（统计信息在底部状态栏） -->
    <header class="diff-header">
      <div class="diff-titles">
        <h1>📑 文件对比工具</h1>
      </div>
      <div class="diff-toolbar">
        <button class="btn-compare" :disabled="isResult || !canCompare" title="两侧均需有内容才能对比" @click="runCompare">⚡
          对比</button>
        <button class="btn-swap" :disabled="isResult || emptyBoth" @click="swap">⇄ 互换</button>
        <button :disabled="isResult" @click="loadSample">载入示例</button>
        <button :disabled="emptyBoth" @click="clearAll">清空</button>
        <button v-if="isResult" class="btn-edit" @click="editMode">✏️ 编辑</button>
      </div>
    </header>

    <!-- 分屏对比：桌面左右拖拽 / 移动上下拖拽 -->
    <main ref="mainRef">
      <!-- 面板 A（左 / 上） -->
      <section class="pane pane-a" :style="paneStyle">
        <div class="pane-title">
          <span class="pane-name">文件 A<span v-if="isResult" class="mode-tag">结果</span><span class="pane-meta">{{
              leftMeta }}</span></span>
          <label class="file-btn">📂 打开文件
            <input type="file"
              accept=".txt,.json,.log,.md,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.h,.html,.css,.scss,.xml,.yml,.yaml,.csv,.ini,.conf,.sh,.sql,text/*,application/json"
              hidden @change="onFile('A', $event)" />
          </label>
        </div>
        <div class="pane-body">
          <textarea ref="inputA" class="diff-textarea" :class="{ editing: !isResult }" :readonly="isResult"
            :value="leftText" wrap="off" spellcheck="false" @input="onEdit('A', $event)"
            @scroll="onScroll('A')"></textarea>
          <div class="diff-overlay" ref="layerA" v-show="isResult">
            <div class="overlay-line-nums" :style="lineNumStyle('A')">
              <div class="overlay-num-spacer" :style="{ height: winA.start * LINE_H + 'px' }"></div>
              <div v-for="row in visibleRowsA" :key="row.k" class="line-num" :class="'n-' + row.t">{{ row.k + 1 }}</div>
            </div>
            <div class="overlay-inner" :style="overlayStyle('A')">
              <div class="overlay-spacer" :style="{ height: winA.start * LINE_H + 'px' }"></div>
              <div v-for="row in visibleRowsA" :key="row.k" class="diff-row" :class="'t-' + row.t">{{ row.txt }}</div>
            </div>
          </div>
          <div v-if="!leftText" class="empty-hint">
            <p class="empty-icon">⬅️</p>
            <p>左侧内容为空<br />点击「📂 打开文件」或直接粘贴</p>
          </div>
        </div>
      </section>

      <!-- 拖拽分隔条 -->
      <div class="resizer" :class="{ dragging: resizing }" @pointerdown="startResize"></div>

      <!-- 面板 B（右 / 下） -->
      <section class="pane pane-b">
        <div class="pane-title">
          <span class="pane-name">文件 B<span v-if="isResult" class="mode-tag">结果</span><span class="pane-meta">{{
              rightMeta }}</span></span>
          <label class="file-btn">📂 打开文件
            <input type="file"
              accept=".txt,.json,.log,.md,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.h,.html,.css,.scss,.xml,.yml,.yaml,.csv,.ini,.conf,.sh,.sql,text/*,application/json"
              hidden @change="onFile('B', $event)" />
          </label>
        </div>
        <div class="pane-body">
          <textarea ref="inputB" class="diff-textarea" :class="{ editing: !isResult }" :readonly="isResult"
            :value="rightText" wrap="off" spellcheck="false" @input="onEdit('B', $event)"
            @scroll="onScroll('B')"></textarea>
          <div class="diff-overlay" ref="layerB" v-show="isResult">
            <div class="overlay-line-nums" :style="lineNumStyle('B')">
              <div class="overlay-num-spacer" :style="{ height: winB.start * LINE_H + 'px' }"></div>
              <div v-for="row in visibleRowsB" :key="row.k" class="line-num" :class="'n-' + row.t">{{ row.k + 1 }}</div>
            </div>
            <div class="overlay-inner" :style="overlayStyle('B')">
              <div class="overlay-spacer" :style="{ height: winB.start * LINE_H + 'px' }"></div>
              <div v-for="row in visibleRowsB" :key="row.k" class="diff-row" :class="'t-' + row.t">{{ row.txt }}</div>
            </div>
          </div>
          <div v-if="!rightText" class="empty-hint">
            <p class="empty-icon">➡️</p>
            <p>右侧内容为空<br />点击「📂 打开文件」或直接粘贴</p>
          </div>
        </div>
      </section>
    </main>

    <!-- 底部状态栏：状态信息 -->
    <div class="status-bar">
      <span class="status-msg">{{ status }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useToolStandalone } from '../../composables/useToolStandalone'
import { useSplitPane } from '../../composables/useSplitPane'

// ===== 虚拟滚动常量（必须与 CSS 中 .diff-textarea / .diff-row 的 font-size、line-height、padding 保持一致）=====
const LINE_H = 22
const PAD_TOP = 14
const PAD_BOTTOM = 14

// ===== 示例内容（简短，覆盖新增/删除两类差异）=====
const SAMPLE_A = JSON.stringify(
  {
    name: '示例配置',
    version: '1.0.0',
    retries: 3,
    tags: ['demo', 'config']
  },
  null,
  2
)
const SAMPLE_B = JSON.stringify(
  {
    name: '示例配置（修改版）',
    version: '1.1.0',
    retries: 5,
    tags: ['demo', 'config'],
    ssl: true
  },
  null,
  2
)

// ===== 分屏拖拽 =====
const { mainRef, paneStyle, resizing, startResize } = useSplitPane()
useToolStandalone()

// ===== 状态 =====
const mode = ref('input') // 'input' 输入模式（纯编辑） / 'result' 结果模式（只读展示差异）
const isResult = computed(() => mode.value === 'result')
const leftText = ref('')
const rightText = ref('')
const leftLines = ref([]) // [{ t: 'same'|'del'|'add', txt }]
const rightLines = ref([])
const stats = ref({ add: 0, del: 0, total: 0 })
const status = ref('就绪')

const inputA = ref(null)
const inputB = ref(null)
const layerA = ref(null)
const layerB = ref(null)

// 虚拟窗口：{ start, count, scrollTop, scrollLeft }
const winA = ref({ start: 0, count: 0, scrollTop: 0, scrollLeft: 0 })
const winB = ref({ start: 0, count: 0, scrollTop: 0, scrollLeft: 0 })

const leftEmpty = computed(() => !leftText.value.trim())
const rightEmpty = computed(() => !rightText.value.trim())
// 对比按钮：必须两侧都有数据才可点击
const canCompare = computed(() => !leftEmpty.value && !rightEmpty.value)
const emptyBoth = computed(() => leftEmpty.value && rightEmpty.value)
const leftMeta = computed(() => (leftLines.value.length ? ` · ${leftLines.value.length} 行` : ''))
const rightMeta = computed(() => (rightLines.value.length ? ` · ${rightLines.value.length} 行` : ''))

const visibleRowsA = computed(() => buildVisible(leftLines.value, winA.value))
const visibleRowsB = computed(() => buildVisible(rightLines.value, winB.value))

function buildVisible(lines, win) {
  const out = []
  const end = Math.min(win.start + win.count, lines.length)
  for (let i = win.start; i < end; i++) out.push({ k: i, t: lines[i].t, txt: lines[i].txt })
  return out
}

// 高亮层跟随滚动（垂直 + 水平同步位移）
function overlayStyle(side) {
  const w = side === 'A' ? winA.value : winB.value
  return { transform: `translateY(${-w.scrollTop}px) translateX(${-w.scrollLeft}px)` }
}

// 行号栏跟随滚动：只做垂直位移，横向滚动时行号栏固定在左侧不动
function lineNumStyle(side) {
  const w = side === 'A' ? winA.value : winB.value
  return { transform: `translateY(${-w.scrollTop}px)` }
}

// ===== 虚拟窗口计算（依据 textarea 实际滚动位置）=====
function syncWindow(side) {
  const el = side === 'A' ? inputA.value : inputB.value
  if (!el) return
  const st = el.scrollTop
  const sl = el.scrollLeft
  const start = Math.max(0, Math.floor((st - PAD_TOP) / LINE_H))
  const count = Math.ceil((el.clientHeight - PAD_TOP - PAD_BOTTOM) / LINE_H) + 2
  const win = { start, count, scrollTop: st, scrollLeft: sl }
  if (side === 'A') winA.value = win
  else winB.value = win
}

// 同步滚动：一侧滚动时另一侧跟随（同一事件循环内直接同步，保证高亮层与滚动同帧、无拖影）
// 内容较短一侧无法滚动到目标位置（被浏览器 clamp）时的时间戳：
// 该时刻前，程序化同步触发的滚动只刷新自身虚拟窗口，不再反向同步，避免来回拉扯导致滚动条抖动
let ignoreSyncUntil = 0
function onScroll(side) {
  const now = performance.now()
  const ignored = now < ignoreSyncUntil
  // 立即刷新本侧虚拟窗口：scroll 事件发生在浏览器布局阶段，reactive 更新会在同一帧生效，
  // 不再等 rAF 延迟，避免快速滚动时高亮层滞后产生拖影
  syncWindow(side)
  if (ignored) return
  const el = side === 'A' ? inputA.value : inputB.value
  const other = side === 'A' ? inputB.value : inputA.value
  if (el && other && (other.scrollTop !== el.scrollTop || other.scrollLeft !== el.scrollLeft)) {
    const targetTop = el.scrollTop
    const targetLeft = el.scrollLeft
    other.scrollTop = targetTop
    other.scrollLeft = targetLeft
    // 同步后另一侧实际位置与目标不符 → 被 clamp，抑制其后续反向同步
    if (other.scrollTop !== targetTop || other.scrollLeft !== targetLeft) {
      ignoreSyncUntil = performance.now() + 100
    }
    // 另一侧位置已变，立即刷新其虚拟窗口
    syncWindow(side === 'A' ? 'B' : 'A')
  }
}

function resetScroll() {
  if (inputA.value) {
    inputA.value.scrollTop = 0
    inputA.value.scrollLeft = 0
  }
  if (inputB.value) {
    inputB.value.scrollTop = 0
    inputB.value.scrollLeft = 0
  }
  nextTick(() => {
    syncWindow('A')
    syncWindow('B')
  })
}

// ===== 编辑（输入模式：仅更新文本，点击「对比」后才计算差异）=====
function onEdit(side, e) {
  const v = e.target.value
  if (side === 'A') leftText.value = v
  else rightText.value = v
  status.value = '就绪'
}

// JSON 自动格式化：整体为合法对象/数组时返回格式化后的文本
function tryFormat(text) {
  const t = text.trim()
  if (!t) return { text, formatted: false }
  try {
    const data = JSON.parse(t)
    if (data === null || typeof data !== 'object') return { text, formatted: false }
    return { text: JSON.stringify(data, null, 2), formatted: true }
  } catch (e) {
    return { text, formatted: false }
  }
}

function runDiff() {
  const fa = tryFormat(leftText.value)
  const fb = tryFormat(rightText.value)
  if (fa.formatted && leftText.value !== fa.text) leftText.value = fa.text
  if (fb.formatted && rightText.value !== fb.text) rightText.value = fb.text
  const res = diffLines(fa.text, fb.text)
  leftLines.value = res.left
  rightLines.value = res.right
  let add = 0
  let del = 0
  for (const op of res.ops) {
    if (op.t === 'add') add++
    else if (op.t === 'del') del++
  }
  stats.value = { add, del, total: add + del }
  resetScroll()
}

// ===== 行级 Diff（公共前缀/后缀裁剪 + LCS；超大内容退化为逐行索引比对）=====
function diffLines(a, b) {
  const A = a.split('\n')
  const B = b.split('\n')
  let s = 0
  while (s < A.length && s < B.length && A[s] === B[s]) s++
  let e = 0
  while (e < A.length - s && e < B.length - s && A[A.length - 1 - e] === B[B.length - 1 - e]) e++
  const ops = []
  for (let i = 0; i < s; i++) ops.push({ t: 'same', txt: A[i] })
  buildMiddleOps(A.slice(s, A.length - e), B.slice(s, B.length - e), ops)
  for (let i = A.length - e; i < A.length; i++) ops.push({ t: 'same', txt: A[i] })

  // 拆分为左右两侧各自的渲染行
  const left = []
  const right = []
  for (const op of ops) {
    if (op.t === 'same') {
      left.push({ t: 'same', txt: op.txt })
      right.push({ t: 'same', txt: op.txt })
    } else if (op.t === 'del') {
      left.push({ t: 'del', txt: op.txt })
    } else {
      right.push({ t: 'add', txt: op.txt })
    }
  }
  return { ops, left, right }
}

function buildMiddleOps(A, B, out) {
  if (!A.length && !B.length) return
  if (!A.length) {
    for (const t of B) out.push({ t: 'add', txt: t })
    return
  }
  if (!B.length) {
    for (const t of A) out.push({ t: 'del', txt: t })
    return
  }
  // 超大内容：退化为按行索引对齐，避免卡死
  if (A.length * B.length > 3000000) {
    const len = Math.max(A.length, B.length)
    for (let i = 0; i < len; i++) {
      if (i < A.length && i < B.length && A[i] === B[i]) out.push({ t: 'same', txt: A[i] })
      else {
        if (i < A.length) out.push({ t: 'del', txt: A[i] })
        if (i < B.length) out.push({ t: 'add', txt: B[i] })
      }
    }
    return
  }
  // LCS 动态规划 + 回溯
  const n = A.length
  const m = B.length
  const w = m + 1
  const dp = new Int32Array((n + 1) * w)
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * w + j] =
        A[i] === B[j]
          ? dp[(i + 1) * w + j + 1] + 1
          : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1])
    }
  }
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      out.push({ t: 'same', txt: A[i] })
      i++
      j++
    } else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) {
      out.push({ t: 'del', txt: A[i] })
      i++
    } else {
      out.push({ t: 'add', txt: B[j] })
      j++
    }
  }
  while (i < n) {
    out.push({ t: 'del', txt: A[i] })
    i++
  }
  while (j < m) {
    out.push({ t: 'add', txt: B[j] })
    j++
  }
}

// ===== 操作：对比 / 编辑 / 打开文件 / 互换 / 载入示例 / 清空 =====
function runCompare() {
  if (!canCompare.value) {
    status.value = '请先在两侧都粘贴或打开文件内容后再对比'
    return
  }
  runDiff()
  mode.value = 'result'
  status.value = `对比完成：新增 ${stats.value.add}，删除 ${stats.value.del}`
}

function editMode() {
  mode.value = 'input'
  leftLines.value = []
  rightLines.value = []
  stats.value = { add: 0, del: 0, total: 0 }
  status.value = '已返回编辑模式，修改后点击「对比」重新对比'
  resetScroll()
}

function onFile(side, e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  if (f.size > 5 * 1024 * 1024) {
    status.value = '文件超过 5MB，请选择更小的文件'
    e.target.value = ''
    return
  }
  const r = new FileReader()
  r.onload = () => {
    const text = r.result || ''
    if (side === 'A') leftText.value = text
    else rightText.value = text
    mode.value = 'input'
    leftLines.value = []
    rightLines.value = []
    stats.value = { add: 0, del: 0, total: 0 }
    status.value = `已打开文件 ${f.name}（${text.split('\n').length} 行），点击「对比」查看差异`
    resetScroll()
  }
  r.onerror = () => {
    status.value = '文件读取失败'
  }
  r.readAsText(f)
  e.target.value = '' // 允许重复选择同一文件
}

function swap() {
  const t = leftText.value
  leftText.value = rightText.value
  rightText.value = t
  status.value = '已互换两侧内容'
}

function loadSample() {
  leftText.value = SAMPLE_A
  rightText.value = SAMPLE_B
  leftLines.value = []
  rightLines.value = []
  stats.value = { add: 0, del: 0, total: 0 }
  mode.value = 'input'
  status.value = '已载入示例，点击「对比」查看差异'
  resetScroll()
}

function clearAll() {
  leftText.value = ''
  rightText.value = ''
  leftLines.value = []
  rightLines.value = []
  stats.value = { add: 0, del: 0, total: 0 }
  mode.value = 'input'
  status.value = '已清空'
  resetScroll()
}

// ===== 生命周期 =====
let ro = null
onMounted(() => {
  ro = new ResizeObserver(() => {
    syncWindow('A')
    syncWindow('B')
  })
  // 监听 textarea 本体（尺寸 = 各自可见区域）：
  // 移动端上下拖拽改变面板高度时 textarea 随之变化，此处触发刷新虚拟窗口，
  // 避免面板变高后高亮层可见行数未更新导致下方区域空白
  if (inputA.value) ro.observe(inputA.value)
  if (inputB.value) ro.observe(inputB.value)
  nextTick(() => {
    syncWindow('A')
    syncWindow('B')
  })
  // 首屏载入示例（输入模式），点击「对比」后展示差异
  loadSample()
})
onUnmounted(() => {
  if (ro) ro.disconnect()
})
</script>

<style scoped>
.file-diff {
  --panel: #ffffff;
  --border-soft: #e3e8ef;
  --muted: #7b8794;
  --accent-soft: #e8f0fe;
  --del-bg: #fdecec;
  --del-text: #c92a2a;
  --add-bg: #e8f7ec;
  --add-text: #1a7f37;
  /* 滚动条（亮色主题）：滑块 / 悬停 / 轨道 */
  --scroll-thumb: #c9d0d8;
  --scroll-thumb-hover: #aeb7c1;
  --scroll-track: transparent;

  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
}

/* 暗色主题：跟随全局 useTheme 切换（data-theme="dark"）覆盖 FileDiff 自有变量 */
[data-theme="dark"] .file-diff {
  --panel: #16181d;
  --border-soft: #2a2f38;
  --muted: #8a93a0;
  --accent-soft: #1e2b45;
  --del-bg: rgba(255, 123, 114, 0.16);
  --del-text: #ffb3ad;
  --add-bg: rgba(63, 185, 80, 0.16);
  --add-text: #a5e0af;
  /* 滚动条（暗色主题）：深色滑块，避免原生亮色滚动条刺眼 */
  --scroll-thumb: #3d4552;
  --scroll-thumb-hover: #505a6a;
  --scroll-track: transparent;
}

/* ===== 顶栏（紧凑，让对比区更大）===== */
.diff-header {
  padding: 8px 14px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: none;
}

.diff-titles {
  min-width: 0;
}

.diff-titles h1 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.diff-titles .sub {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.diff-toolbar {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.diff-toolbar button {
  padding: 7px 14px;
  font-size: 13px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.diff-toolbar button:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.diff-toolbar button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-swap {
  font-weight: 600;
  color: var(--accent) !important;
  border-color: var(--accent) !important;
}

/* 「对比」主按钮：与 JSON 格式化查看器的「格式化」按钮样式一致 */
.diff-toolbar .btn-compare {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #fff;
  background: var(--accent);
  border-color: var(--accent);
  border-radius: 7px;
  padding: 7px 13px;
  transition: all 0.15s;
}

.diff-toolbar .btn-compare:hover:not(:disabled) {
  color: #fff;
  border-color: var(--accent);
  background: #2459c9;
}

/* ===== 分屏主体：桌面左右 ===== */
.file-diff main {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.pane {
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pane-a {
  flex: none;
  width: 50%;
}

.pane-b {
  flex: 1 1 0;
}

.pane-title {
  flex: none;
  padding: 6px 10px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--muted);
}

.pane-name {
  font-weight: 600;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.pane-meta {
  font-weight: 400;
  color: var(--muted);
}

/* 结果模式徽标 */
.mode-tag {
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 999px;
  white-space: nowrap;
}

.file-btn {
  padding: 4px 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--accent);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;
}

.file-btn:hover {
  color: var(--accent);
  background: var(--accent-soft);
}

.pane-body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--panel);
}

/* ===== 对比区域：透明 textarea 承载编辑 + 高亮层渲染着色行 ===== */
.diff-textarea {
  position: absolute;
  inset: 0;
  /* 置于高亮层之上：textarea 内容/背景透明，颜色透出显示，但滚动条不被颜色区域遮挡 */
  z-index: 1;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  resize: none;
  border: none;
  outline: none;
  padding: 14px 16px;
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 22px;
  white-space: pre;
  overflow: auto;
  color: transparent;
  caret-color: var(--text);
  background: transparent;
  overscroll-behavior: contain;
}

/* 输入模式：无高亮层，由 textarea 直接显示文本 */
.diff-textarea.editing {
  color: var(--text);
}

/* ===== 滚动条：亮/暗主题适配，横向 + 竖向，兼容 WebKit 与 Firefox ===== */
.diff-textarea {
  scrollbar-width: thin;
  scrollbar-color: var(--scroll-thumb) var(--scroll-track);
}

.diff-textarea::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.diff-textarea::-webkit-scrollbar-track {
  background: var(--scroll-track);
}

.diff-textarea::-webkit-scrollbar-thumb {
  background: var(--scroll-thumb);
  border-radius: 6px;
  /* 与面板同色的描边，让滑块在暗色下呈内嵌效果、不显突兀 */
  border: 2px solid var(--panel);
}

.diff-textarea::-webkit-scrollbar-thumb:hover {
  background: var(--scroll-thumb-hover);
}

/* 滚动条两轴交叉处的角 */
.diff-textarea::-webkit-scrollbar-corner {
  background: var(--scroll-track);
}

.diff-overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.overlay-inner {
  position: absolute;
  top: 0;
  left: 0;
  width: max-content;
  min-width: 100%;
  box-sizing: border-box;
  /* 左侧为行号栏让位（60px 行号栏 + 1px 分隔线 + 16px 原文间距） */
  padding: 14px 16px 14px 77px;
  will-change: transform;
}

/* ===== 行号栏：固定在左侧，仅随垂直滚动位移 =====
   高度由内容撑开（不做自身 overflow 裁剪），由父级 .diff-overlay 裁剪，
   与文本层同机制：spacer 占位 + transform 位移，避免双重偏移导致行号空白 */
.overlay-line-nums {
  position: absolute;
  top: 0;
  left: 0;
  width: 60px;
  z-index: 1;
  box-sizing: border-box;
  /* 不透明背景：横向滚动时遮住从行号栏下方穿过的文本 */
  background: var(--panel);
  border-right: 1px solid var(--border);
  padding: 14px 10px 14px 8px;
  will-change: transform;
}

.overlay-num-spacer {
  width: 1px;
}

.line-num {
  height: 22px;
  line-height: 22px;
  font-size: 12px;
  font-family: var(--font-sans);
  text-align: right;
  white-space: nowrap;
  user-select: none;
  color: var(--muted);
}

/* 行号随差异类型着色 */
.line-num.n-del {
  color: var(--del-text);
}

.line-num.n-add {
  color: var(--add-text);
}

.overlay-spacer {
  width: 1px;
}

.diff-row {
  height: 22px;
  line-height: 22px;
  font-size: 13px;
  font-family: var(--font-sans);
  white-space: pre;
  overflow: hidden;
  box-sizing: border-box;
  padding: 0 4px;
  color: var(--text);
}

.t-del {
  background: var(--del-bg);
  color: var(--del-text);
}

.t-add {
  background: var(--add-bg);
  color: var(--add-text);
}

/* ===== 空状态提示 ===== */
.empty-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-size: 13px;
  line-height: 1.8;
  color: var(--muted);
  pointer-events: none;
}

.empty-hint .empty-icon {
  font-size: 22px;
  margin: 0 0 6px;
}

/* ===== 拖拽分隔条 ===== */
.resizer {
  flex: none;
  width: 5px;
  background: var(--border);
  cursor: col-resize;
  touch-action: none;
  user-select: none;
  transition: background 0.15s ease;
}

.resizer:hover,
.resizer.dragging {
  background: var(--accent);
}

/* 桌面端：忽略 paneStyle 的内联高度（仅使用 width），让面板纵向撑满 */
@media (min-width: 761px) {
  .pane-a {
    height: auto !important;
  }
}

/* ===== 底部状态栏：状态信息 ===== */
.status-bar {
  flex: none;
  padding: 4px 14px;
  font-size: 12px;
  color: var(--muted);
  background: var(--panel);
  border-top: 1px solid var(--border);
}

.status-msg {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 移动端：整页固定 + 上下分屏拖拽 ===== */
@media (max-width: 734px) {
  .file-diff {
    position: fixed;
    inset: 0;
    height: auto;
  }

  .file-diff main {
    flex-direction: column;
  }

  .pane-a {
    width: 100% !important;
  }

  .resizer {
    width: auto;
    height: 14px;
    cursor: row-resize;
  }

  .diff-titles .sub {
    display: none;
  }

  .diff-toolbar {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .diff-toolbar button {
    padding: 6px 10px;
    font-size: 12px;
  }
}
</style>
