<template>
  <div class="base64-codec">
    <header>
      <h1><span class="logo">🔡</span> BASE64 加密/解密</h1>
      <div class="toolbar">
        <button class="primary" @click="submit">🖱 提交</button>
        <button :disabled="!output" @click="copyOutput">📋 复制结果</button>
        <button @click="swap" :disabled="!output">↔️ 互换</button>
      </div>
    </header>

    <main ref="mainRef">
      <section class="editor" :style="paneStyle">
        <div class="pane-title"><span>输入区</span></div>
        <div class="config">
          <div class="row">
            <span class="label">加密/解密：</span>
            <label class="radio">
              <input type="radio" value="encode" v-model="mode" />
              <span>加密</span>
            </label>
            <label class="radio">
              <input type="radio" value="decode" v-model="mode" />
              <span>解密</span>
            </label>
          </div>

          <div class="row">
            <span class="label">字符编码：</span>
            <select v-model="charset" class="charset-select">
              <option value="UTF-8">UTF-8</option>
              <option value="GBK">GBK</option>
            </select>
          </div>

          <textarea v-model="input" class="input-area" spellcheck="false" placeholder="请输入待加密或解密的文本"></textarea>

          <div v-if="error" class="error-msg">{{ error }}</div>
        </div>
      </section>

      <div class="resizer" :class="{ dragging: resizing }" @pointerdown="startResize"></div>

      <section class="preview">
        <div class="pane-title"><span>结果区</span></div>
        <div class="preview-scroll">
          <textarea v-if="output" v-model="output" readonly spellcheck="false" class="output-area"></textarea>
          <div v-else class="empty-hint">输入内容后点击「提交」即可获得结果</div>
        </div>
      </section>
    </main>

    <div class="status-bar" :class="{ error: !!error }">{{ status }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as Encoding from 'encoding-japanese'

/* ---------- 输入/输出状态 ---------- */
const mode = ref('encode')   // encode 加密 | decode 解密
const charset = ref('UTF-8') // UTF-8 | GBK
const input = ref('')
const output = ref('')
const error = ref('')
const status = ref('就绪')

/* ---------- 隐藏站点全局导航栏（tool-standalone 模式） ---------- */
onMounted(() => document.body.classList.add('tool-standalone'))
onUnmounted(() => document.body.classList.remove('tool-standalone'))

/* ---------- 加密/解密 ---------- */
function submit() {
  error.value = ''
  if (!input.value) {
    status.value = '请输入内容'
    return
  }

  try {
    if (mode.value === 'encode') {
      output.value = base64Encode(input.value, charset.value)
      status.value = '加密成功 ✓ ' + new Date().toLocaleTimeString()
    } else {
      output.value = base64Decode(input.value, charset.value)
      status.value = '解密成功 ✓ ' + new Date().toLocaleTimeString()
    }
  } catch (e) {
    error.value = e.message || '操作失败'
    status.value = error.value
  }
}

// 字节数组 -> Base64 字符串（自实现，避免 btoa 的 Latin1 范围限制）
function bytesToBase64(bytes) {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i]
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0
    out += CHARS[b1 >> 2]
    out += CHARS[((b1 & 3) << 4) | (b2 >> 4)]
    out += i + 1 < bytes.length ? CHARS[((b2 & 15) << 2) | (b3 >> 6)] : '='
    out += i + 2 < bytes.length ? CHARS[b3 & 63] : '='
  }
  return out
}

// Base64 字符串 -> 字节数组（自实现，避免 atob 的兼容问题）
function base64ToBytes(b64) {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const map = Object.create(null)
  for (let i = 0; i < CHARS.length; i++) map[CHARS[i]] = i
  const clean = b64.replace(/[^A-Za-z0-9+/=]/g, '')
  const bytes = []
  let buffer = 0
  let bits = 0
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i]
    if (c === '=') break
    const val = map[c]
    if (val === undefined) continue
    buffer = (buffer << 6) | val
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes.push((buffer >> bits) & 0xff)
    }
  }
  return bytes
}

// 字符串 -> Base64（UTF-8 用原生 TextEncoder，GBK 用 encoding-japanese）
function base64Encode(text, charsetName) {
  if (charsetName === 'UTF-8') {
    return bytesToBase64(Array.from(new TextEncoder().encode(text)))
  }
  const unicodeArray = Encoding.stringToCode(text)
  const byteArray = Encoding.convert(unicodeArray, { to: 'GBK', from: 'UNICODE' })
  return bytesToBase64(byteArray)
}

// Base64 -> 字符串（UTF-8 用原生 TextDecoder，GBK 用 encoding-japanese）
function base64Decode(base64, charsetName) {
  const byteArray = base64ToBytes(base64)
  if (charsetName === 'UTF-8') {
    return new TextDecoder('utf-8').decode(new Uint8Array(byteArray))
  }
  const unicodeArray = Encoding.convert(byteArray, { to: 'UNICODE', from: 'GBK' })
  return Encoding.codeToString(unicodeArray)
}

/* ---------- 互换输入输出 ---------- */
function swap() {
  if (!output.value) return
  input.value = output.value
  output.value = ''
  mode.value = mode.value === 'encode' ? 'decode' : 'encode'
  status.value = '已互换输入输出，可点击提交'
}

/* ---------- 复制结果 ---------- */
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

async function copyOutput() {
  if (!output.value) return
  let ok = false
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(output.value)
      ok = true
    } else {
      ok = fallbackCopy(output.value)
    }
  } catch (e) {
    ok = fallbackCopy(output.value)
  }
  status.value = ok ? '复制成功 ✓ ' + new Date().toLocaleTimeString() : '复制失败，请手动选择复制'
}

/* ---------- 拖拽分割（桌面左右 / 移动上下） ---------- */
const mainRef = ref(null)
const leftWidth = ref(50)   // 桌面端：左侧输入面板宽度百分比
const topHeight = ref(50)   // 移动端：上方输入区高度百分比（默认 50%，与结果区等高）
const resizing = ref(false)

const paneStyle = computed(() => ({
  width: leftWidth.value + '%',
  height: 'calc(' + topHeight.value + '% - 7px)'
}))

let resizeDir = 'x'

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

function startResize(e) {
  resizing.value = true
  resizeDir = window.innerWidth <= 760 ? 'y' : 'x'
  document.body.style.userSelect = 'none'
  document.addEventListener('pointermove', onResize)
  document.addEventListener('pointerup', stopResize)
  document.addEventListener('pointercancel', stopResize)
  e.preventDefault()
}

function stopResize() {
  resizing.value = false
  document.body.style.userSelect = ''
  document.removeEventListener('pointermove', onResize)
  document.removeEventListener('pointerup', stopResize)
  document.removeEventListener('pointercancel', stopResize)
}
</script>

<style scoped>
.base64-codec {
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

button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

button.primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

button.primary:hover {
  background: #2459c9;
}

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
  border-right: none;
}

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

.config {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px 20px;
  background: var(--panel);
}

.row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.label {
  font-size: 14px;
  color: var(--text);
}

.radio {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}

.radio input[type="radio"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}

.charset-select {
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 7px;
  font: inherit;
  font-size: 14px;
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  min-width: 100px;
}

.input-area,
.output-area {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 8px;
  outline: none;
  resize: none;
  padding: 16px;
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.6;
  color: var(--text);
  background: var(--bg);
  overscroll-behavior: contain;
  min-height: 0;
}

.output-area {
  color: var(--success, #0f6b38);
}

.error-msg {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 7px;
  background: var(--error-bg, rgba(244, 67, 54, .1));
  color: var(--error);
  font-size: 13px;
}

.preview-scroll {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
  background: var(--panel);
}

.empty-hint {
  color: var(--muted);
  text-align: center;
  margin: auto;
  font-size: 14px;
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

@media (max-width: 760px) {
  .base64-codec {
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

  .row {
    gap: 12px;
  }

  .input-area,
  .output-area {
    font-size: 15px;
  }
}
</style>
