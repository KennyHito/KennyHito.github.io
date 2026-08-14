<template>
  <div class="pwd-gen">
    <header>
      <h1><span class="logo">🔐</span> 随机密码生成器</h1>
      <div class="toolbar">
        <button class="primary" @click="generate">🎲 生成随机密码</button>
        <button :disabled="!result" @click="copyResult">📋 复制结果</button>
      </div>
    </header>

    <main ref="mainRef">
      <section class="editor" :style="paneStyle">
        <div class="pane-title"><span>密码规则</span></div>
        <div class="config">
          <div class="rule-row">
            <label class="checkbox">
              <input type="checkbox" v-model="includeUpper" />
              <span>大写字母（A-Z）</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" v-model="includeLower" />
              <span>小写字母（a-z）</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" v-model="includeNumber" />
              <span>数字（0-9）</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" v-model="includeSpecial" />
              <span>特殊字符（!@#$%…）</span>
            </label>
          </div>

          <div class="length-row">
            <span class="label">密码长度：</span>
            <input type="number" class="length-input" v-model.number="length" min="1" max="128" />
            <input type="range" class="length-range" v-model.number="length" min="1" max="128" />
          </div>

          <div v-if="error" class="error-msg">{{ error }}</div>
        </div>
      </section>

      <div class="resizer" :class="{ dragging: resizing }" @pointerdown="startResize"></div>

      <section class="preview">
        <div class="pane-title"><span>生成结果</span></div>
        <div class="preview-scroll">
          <textarea v-if="result" v-model="result" readonly spellcheck="false" class="result-text"></textarea>
          <div v-else class="empty-hint">设置规则后点击「生成随机密码」即可获得结果</div>
        </div>
      </section>
    </main>

    <div class="status-bar" :class="{ error: !!error }">{{ status }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

/* ---------- 字符池 ---------- */
const CHARS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  number: '0123456789',
  special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
}

/* ---------- 配置状态 ---------- */
const includeUpper = ref(true)
const includeLower = ref(false)
const includeNumber = ref(true)
const includeSpecial = ref(false)
const length = ref(16)
const result = ref('')
const error = ref('')
const status = ref('就绪')

/* ---------- 隐藏站点全局导航栏（tool-standalone 模式） ---------- */
onMounted(() => document.body.classList.add('tool-standalone'))
onUnmounted(() => document.body.classList.remove('tool-standalone'))

/* ---------- 生成密码 ---------- */
function generate() {
  error.value = ''
  status.value = '就绪'

  if (length.value < 1 || length.value > 128) {
    error.value = '密码长度应在 1 ~ 128 之间'
    status.value = error.value
    return
  }

  let pool = ''
  if (includeUpper.value) pool += CHARS.upper
  if (includeLower.value) pool += CHARS.lower
  if (includeNumber.value) pool += CHARS.number
  if (includeSpecial.value) pool += CHARS.special

  if (!pool) {
    error.value = '请至少选择一种字符类型'
    status.value = error.value
    return
  }

  let pwd = ''
  const randomValues = new Uint32Array(length.value)
  window.crypto.getRandomValues(randomValues)
  for (let i = 0; i < length.value; i++) {
    pwd += pool[randomValues[i] % pool.length]
  }

  result.value = pwd
  status.value = '生成成功 ✓ ' + new Date().toLocaleTimeString()
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
const leftWidth = ref(50)   // 桌面端：左侧配置面板宽度百分比
const topHeight = ref(50)   // 移动端：上方配置区高度百分比（默认 50%，与结果区等高）
const resizing = ref(false)

// 面板内联尺寸：同时输出 width/height，桌面用 width、移动用 height，另一项由 CSS 忽略
// 高度 -7px：为中间拖拽条让位，保证默认时配置区/结果区严格各占一半
const paneStyle = computed(() => ({
  width: leftWidth.value + '%',
  height: 'calc(' + topHeight.value + '% - 7px)'
}))

// 当前拖拽方向：'x' 桌面左右、'y' 移动上下，按触发时窗口宽度实时决定
let resizeDir = 'x'

// 拖拽中：按 resizeDir 更新宽度或高度，均限制在 20% ~ 80%
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

// 开始拖拽：锁定全局选中，注册全局指针监听
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
</script>

<style scoped>
.pwd-gen {
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

/* 桌面端忽略内联 height */
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
  overflow: auto;
  padding: 20px;
  background: var(--panel);
  overscroll-behavior: contain;
}

.rule-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}

.checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}

.length-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.length-row .label {
  font-size: 14px;
  color: var(--text);
}

.length-input {
  width: 70px;
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: 7px;
  font: inherit;
  font-size: 14px;
  background: var(--bg);
  color: var(--text);
}

.length-range {
  flex: 1;
  min-width: 120px;
  accent-color: var(--accent);
}

.error-msg {
  margin-top: 14px;
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
  overflow: auto;
  padding: 16px;
  background: var(--panel);
  overscroll-behavior: contain;
}

.result-text {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 8px;
  outline: none;
  resize: none;
  padding: 16px;
  font-family: var(--font-sans);
  font-size: 20px;
  line-height: 1.6;
  color: var(--success, #0f6b38);
  background: var(--bg);
  text-align: center;
  word-break: break-all;
  overscroll-behavior: contain;
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
  .pwd-gen {
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

  .rule-row {
    grid-template-columns: 1fr;
  }

  .length-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .length-range {
    width: 100%;
  }
}
</style>
