<template>
  <div class="password-generator">
    <header>
      <h1><span class="logo">🔐</span> 随机密码生成器</h1>
      <div class="toolbar">
        <button class="primary" @click="generate">🎲 生成随机密码</button>
        <button :disabled="!result" @click="copyResult">📋 复制结果</button>
      </div>
    </header>

    <main ref="mainRef">
      <section class="controls" :style="paneStyle">
        <div class="pane-title"><span>配置区</span></div>
        <div class="config">
          <div class="opt">
            <label class="check">
              <input type="checkbox" v-model="useUpper" />
              <span>大写字母 (A-Z)</span>
            </label>
            <label class="check">
              <input type="checkbox" v-model="useLower" />
              <span>小写字母 (a-z)</span>
            </label>
            <label class="check">
              <input type="checkbox" v-model="useNumber" />
              <span>数字 (0-9)</span>
            </label>
            <label class="check">
              <input type="checkbox" v-model="useSpecial" />
              <span>特殊字符 (!@#$...)</span>
            </label>
          </div>

          <div class="row">
            <span class="label">密码长度</span>
            <input class="length-input" type="number" min="1" max="128" v-model.number="length" @change="clampLength" />
          </div>
          <input class="range" type="range" min="1" max="128" v-model.number="length" />

          <div v-if="error" class="error-msg">{{ error }}</div>
        </div>
      </section>

      <div class="resizer" :class="{ dragging: resizing }" @pointerdown="startResize"></div>

      <section class="result">
        <div class="pane-title"><span>结果区</span></div>
        <div class="preview-scroll">
          <textarea v-if="result" v-model="result" readonly spellcheck="false" class="output-area"></textarea>
          <div v-else class="empty-hint">配置后点击「生成随机密码」即可生成</div>
        </div>
      </section>
    </main>

    <div class="status-bar" :class="{ error: !!error }">{{ status }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

/* ---------- 配置状态 ---------- */
const useUpper = ref(true)
const useLower = ref(true)
const useNumber = ref(true)
const useSpecial = ref(false)
const length = ref(12)
const result = ref('')
const error = ref('')
const status = ref('就绪')

/* ---------- 隐藏站点全局导航栏（tool-standalone 模式） ---------- */
onMounted(() => document.body.classList.add('tool-standalone'))
onUnmounted(() => document.body.classList.remove('tool-standalone'))

/* ---------- 长度约束 ---------- */
function clampLength() {
  if (!length.value || length.value < 1) length.value = 1
  if (length.value > 128) length.value = 128
}

/* ---------- 生成密码 ---------- */
function generate() {
  error.value = ''
  let charset = ''
  if (useUpper.value) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (useLower.value) charset += 'abcdefghijklmnopqrstuvwxyz'
  if (useNumber.value) charset += '0123456789'
  if (useSpecial.value) charset += '!@#$%^&*()-_=+[]{};:,.<>?/~'

  if (!charset) {
    error.value = '请至少选择一种字符类型'
    status.value = error.value
    return
  }

  clampLength()
  const len = length.value

  // 使用加密级随机数，排除偏置（random() % len 重试法）
  const buf = new Uint32Array(len)
  crypto.getRandomValues(buf)
  let pwd = ''
  for (let i = 0; i < len; i++) {
    const maxValid = 4294967295 - ((4294967295 % charset.length) + 1) % charset.length
    let rand = buf[i]
    while (rand > maxValid) {
      rand = crypto.getRandomValues(new Uint32Array(1))[0]
    }
    pwd += charset[rand % charset.length]
  }

  result.value = pwd
  status.value = '已生成 ' + len + ' 位密码，点击「复制结果」使用'
}

/* ---------- 复制结果 ---------- */
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

async function copyResult() {
  if (!result.value) return
  let ok = false
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(result.value)
      ok = true
    } else {
      ok = fallbackCopy(result.value)
    }
  } catch (e) {
    ok = fallbackCopy(result.value)
  }
  if (ok) {
    status.value = '复制成功 ✓ ' + new Date().toLocaleTimeString()
  } else {
    status.value = '复制失败，请手动选择复制'
  }
}

/* ---------- 拖拽分割（桌面左右 / 移动上下） ---------- */
const mainRef = ref(null)
const leftWidth = ref(50)   // 桌面端：配置面板宽度百分比
const topHeight = ref(50)   // 移动端：配置区高度百分比（默认 50%，与结果区等高）
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
  try { e.target.setPointerCapture(e.pointerId) } catch (_) { }
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
.password-generator {
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

.controls,
.result {
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.controls {
  flex: none;
  width: 50%;
}

@media (min-width: 761px) {
  .controls {
    height: auto !important;
  }
}

.result {
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
}

.config {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px 20px;
  background: var(--panel);
}

.opt {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}

.check input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.label {
  font-size: 14px;
  color: var(--text);
}

.length-input {
  width: 72px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 7px;
  font: inherit;
  font-size: 14px;
  background: var(--bg);
  color: var(--text);
  text-align: center;
}

.range {
  width: 100%;
  accent-color: var(--accent);
  margin-bottom: 16px;
}

.gen-btn {
  align-self: flex-start;
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

.output-area {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 8px;
  outline: none;
  resize: none;
  padding: 16px;
  font-family: var(--font-mono, ui-monospace, Menlo, Consolas, monospace);
  font-size: 20px;
  line-height: 1.8;
  color: var(--success, #0f6b38);
  background: var(--bg);
  overscroll-behavior: contain;
  min-height: 0;
  word-break: break-all;
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
  .password-generator {
    position: fixed;
    inset: 0;
    height: auto;
    overscroll-behavior: none;
  }

  main {
    flex-direction: column;
  }

  .controls {
    border-bottom: 1px solid var(--border);
    width: 100% !important;
    flex: none;
    min-height: 0;
  }

  .result {
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

  .output-area {
    font-size: 16px;
  }
}
</style>
