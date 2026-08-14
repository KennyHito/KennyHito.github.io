<template>
  <div class="color-converter">
    <header>
      <h1><span class="logo">🎨</span> RGB/Hex 颜色转换工具</h1>
      <div class="toolbar">
        <button class="primary" @click="convert">🖱 转换</button>
        <button :disabled="!output" @click="copyOutput">📋 复制结果</button>
        <button :disabled="!canSwap" @click="swap">↔️ 互换</button>
      </div>
    </header>

    <main ref="mainRef">
      <section class="editor" :style="paneStyle">
        <div class="pane-title">
          <span>{{ mode === 'rgb2hex' ? '输入 RGB 颜色值' : '输入十六进制颜色码' }}</span>
          <span class="link" @click="clearAll">清空</span>
        </div>
        <div class="config">
          <!-- RGB 输入模式 -->
          <template v-if="mode === 'rgb2hex'">
            <div class="rgb-list">
              <label class="rgb-field">
                <span>R</span>
                <input v-model.number="r" type="number" min="0" max="255" placeholder="0-255" />
                <input v-model.number="r" type="range" min="0" max="255" class="bar" />
                <span class="bar-value">{{ clampVal(r) }}</span>
              </label>
              <label class="rgb-field">
                <span>G</span>
                <input v-model.number="g" type="number" min="0" max="255" placeholder="0-255" />
                <input v-model.number="g" type="range" min="0" max="255" class="bar" />
                <span class="bar-value">{{ clampVal(g) }}</span>
              </label>
              <label class="rgb-field">
                <span>B</span>
                <input v-model.number="b" type="number" min="0" max="255" placeholder="0-255" />
                <input v-model.number="b" type="range" min="0" max="255" class="bar" />
                <span class="bar-value">{{ clampVal(b) }}</span>
              </label>
            </div>
          </template>
          <!-- Hex 输入模式 -->
          <template v-else>
            <div class="hex-row">
              <label class="hex-field">
                <span>HEX</span>
                <input v-model="hexInput" spellcheck="false" placeholder="#ff0000 或 ff0000" />
              </label>
            </div>
          </template>
          <div v-if="error" class="error-msg">{{ error }}</div>
        </div>
      </section>

      <div class="resizer" :class="{ dragging: resizing }" @pointerdown="startResize"></div>

      <section class="preview">
        <div class="pane-title">
          <span>{{ mode === 'rgb2hex' ? '十六进制颜色码结果' : 'RGB 颜色值结果' }}</span>
          <span v-if="output" class="meta">{{ previewColor }}</span>
        </div>
        <div class="preview-scroll">
          <div v-if="output" class="result-card">
            <div class="swatch" :style="{ backgroundColor: previewColor }"></div>
            <div class="result-value">{{ output }}</div>
          </div>
          <div v-else class="empty-hint">输入颜色值并切换方向即可自动转换</div>
        </div>
      </section>
    </main>

    <div class="status-bar" :class="{ error: !!error }">{{ status }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../composables/useClipboard'
import { useToolStandalone } from '../composables/useToolStandalone'
import { useSplitPane } from '../composables/useSplitPane'

/* ---------- 状态 ---------- */
const mode = ref('rgb2hex') // 'rgb2hex' | 'hex2rgb'
const r = ref(255)
const g = ref(180)
const b = ref(0)
const hexInput = ref('#cc00ff')
const output = ref('')
const error = ref('')
const status = ref('就绪')

/* ---------- 公共 composable ---------- */
useToolStandalone()
const { mainRef, paneStyle, resizing, startResize } = useSplitPane()

/* ---------- 计算属性 ---------- */
const previewColor = computed(() => {
  if (mode.value === 'rgb2hex') return `#${output.value}`
  // Hex -> RGB 模式：必须拼成合法 CSS 颜色值 rgb(r,g,b)，色块才会随输入实时更新
  return output.value ? `rgb(${output.value})` : ''
})

const canSwap = computed(() => {
  return !!output.value
})

/* ---------- 转换函数 ---------- */
function clamp(n) {
  return Math.max(0, Math.min(255, Math.round(n) || 0))
}

function clampVal(n) {
  return clamp(Number(n))
}

function toHex(n) {
  const hex = clamp(n).toString(16)
  return hex.length === 1 ? '0' + hex : hex
}

function rgbToHex(red, green, blue) {
  return `${toHex(red)}${toHex(green)}${toHex(blue)}`
}

function parseHex(hex) {
  let s = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{3,8}$/.test(s)) return null
  if (s.length === 3) {
    s = s.split('').map(c => c + c).join('')
  } else if (s.length === 4) {
    s = s.slice(0, 3).split('').map(c => c + c).join('') + s[3] + s[3]
  } else if (s.length === 8) {
    s = s.slice(0, 6)
  }
  if (s.length !== 6) return null
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16)
  ]
}

function hexToRgb(hex) {
  const rgb = parseHex(hex)
  if (!rgb) return null
  return `${rgb[0]},${rgb[1]},${rgb[2]}`
}

/* ---------- 自动转换 ---------- */
function convert() {
  error.value = ''
  if (mode.value === 'rgb2hex') {
    const rr = clamp(r.value)
    const gg = clamp(g.value)
    const bb = clamp(b.value)
    output.value = rgbToHex(rr, gg, bb).toLowerCase()
    status.value = '转换成功 ✓'
  } else {
    const result = hexToRgb(hexInput.value)
    if (result === null) {
      error.value = '无效的十六进制颜色码'
      output.value = ''
      status.value = '转换失败：输入格式错误'
      return
    }
    output.value = result
    status.value = '转换成功 ✓'
  }
}

/* ---------- 清空：清空内容并恢复初始转换模式（RGB->Hex） ---------- */
function clearAll() {
  r.value = 0
  g.value = 0
  b.value = 0
  hexInput.value = ''
  output.value = ''
  error.value = ''
  mode.value = 'rgb2hex'
  status.value = '已清空'
}

/* ---------- 互换输入输出 ---------- */
function swap() {
  error.value = ''
  if (mode.value === 'rgb2hex') {
    // RGB -> Hex 后，把 Hex 回填到输入区，切换到 Hex2RGB 并立即转换
    if (!output.value) return
    hexInput.value = '#' + output.value
    mode.value = 'hex2rgb'
    convert()
  } else {
    // Hex -> RGB 后，把 RGB 回填到输入区，切换到 RGB2Hex 并立即转换
    if (!output.value) return
    const parts = output.value.split(',').map(s => parseInt(s.trim(), 10))
    r.value = parts[0] || 0
    g.value = parts[1] || 0
    b.value = parts[2] || 0
    mode.value = 'rgb2hex'
    convert()
  }
}

/* ---------- 复制结果 ---------- */
async function copyOutput() {
  if (!output.value) return
  const text = mode.value === 'rgb2hex' ? '#' + output.value : output.value
  const ok = await copyText(text)
  status.value = ok ? '复制成功 ✓ ' + new Date().toLocaleTimeString() : '复制失败，请手动选择'
}
</script>

<style scoped>
/* ---------- 根布局 ---------- */
.color-converter {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
}

/* ---------- 顶栏 ---------- */
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

button {
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

button:hover {
  background: var(--accent-soft);
  border-color: var(--accent);
}

button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

button.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

button.primary:hover {
  opacity: .9;
  background: var(--accent);
}

/* ---------- 主区域 ---------- */
main {
  flex: 1;
  display: flex;
  overflow: hidden;
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
}

@media (min-width: 761px) {
  .editor {
    height: auto !important;
  }
}

.preview {
  flex: 1 1 0;
}

/* ---------- 拖拽分割条 ---------- */
.resizer {
  width: 5px;
  flex: 0 0 5px;
  cursor: col-resize;
  background: var(--border);
  transition: background .15s;
  touch-action: none;
}

.resizer:hover,
.resizer.dragging {
  background: var(--accent);
}

/* ---------- 面板标题 ---------- */
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

.meta {
  font-size: 12px;
  color: var(--muted);
}

/* ---------- 输入面板 ---------- */
.config {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
  background: var(--panel);
  gap: 16px;
}

.rgb-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hex-row {
  display: flex;
  gap: 12px;
}

.rgb-field,
.hex-field {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.rgb-field span,
.hex-field span {
  font-size: 14px;
  color: var(--text);
  font-weight: 600;
  width: 20px;
  flex: 0 0 20px;
}

.rgb-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rgb-field input[type="number"] {
  width: 88px;
  flex: 0 0 88px;
}

.rgb-field .bar {
  flex: 1;
  min-width: 0;
  width: 100%;
  padding: 0;
  margin: 0;
  accent-color: var(--accent);
}

.rgb-field .bar-value {
  width: 32px;
  flex: 0 0 32px;
  text-align: right;
  font-family: var(--font-mono, ui-monospace, Menlo, Consolas, monospace);
  font-size: 13px;
  color: var(--muted);
  font-weight: 400;
}

input {
  font: inherit;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: var(--accent);
}

.hex-field input {
  font-family: var(--font-mono, ui-monospace, Menlo, Consolas, monospace);
  letter-spacing: .5px;
}

.error-msg {
  padding: 10px 12px;
  border-radius: 7px;
  background: var(--error-bg, rgba(244, 67, 54, .1));
  color: var(--error);
  font-size: 13px;
}

/* ---------- 结果面板 ---------- */
.preview-scroll {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
  background: var(--panel);
}

.result-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.swatch {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  border: 1px solid var(--border);
  flex: 0 0 64px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .06);
}

.result-value {
  font-family: var(--font-mono, ui-monospace, Menlo, Consolas, monospace);
  font-size: 20px;
  color: var(--error, #dc2626);
  font-weight: 600;
  word-break: break-all;
}

.empty-hint {
  color: var(--muted);
  text-align: center;
  margin: auto;
  font-size: 14px;
}

/* ---------- 状态栏 ---------- */
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

/* ---------- 链接 ---------- */
.link {
  color: var(--accent);
  cursor: pointer;
  font-size: 12px;
}

.link:hover {
  text-decoration: underline;
}

/* ---------- 移动端 ---------- */
@media (max-width: 760px) {
  .color-converter {
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
    width: 100% !important;
    flex: none;
    min-height: 0;
  }

  .preview {
    flex: 1 1 0;
    min-height: 0;
  }

  .resizer {
    display: block;
    width: 100%;
    height: 14px;
    flex: 0 0 14px;
    cursor: row-resize;
    touch-action: none;
  }
}
</style>
