<template>
  <!-- 根容器：顶栏 + 主区域（输入/结果双面板 + 拖拽条）+ 底部状态栏 -->
  <div class="base64-codec">
    <!-- 顶栏：标题 + 操作按钮 -->
    <header>
      <h1><span class="logo">🔡</span> BASE64 加密/解密</h1>
      <div class="toolbar">
        <button class="primary" @click="submit">🖱 提交</button>
        <button :disabled="!output" @click="copyOutput">📋 复制结果</button>
        <button @click="swap" :disabled="!output">↔️ 互换</button>
      </div>
    </header>

    <!-- 主区域：桌面左右布局（输入 | 拖拽条 | 结果），移动端上下布局 -->
    <main ref="mainRef">
      <!-- 输入面板：加密/解密切换、字符编码、输入框，宽/高由 paneStyle 内联控制 -->
      <section class="editor" :style="paneStyle">
        <div class="pane-title">
          <span>输入区</span>
          <!-- 清空输入与结果 -->
          <span class="link" @click="clearAll">清空</span>
        </div>
        <div class="config">
          <!-- 模式切换：加密（文本->Base64）/ 解密（Base64->文本） -->
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

          <!-- 字符编码：UTF-8 / GBK，决定文本与字节之间的转换规则 -->
          <div class="row">
            <span class="label">字符编码：</span>
            <select v-model="charset" class="charset-select">
              <option value="UTF-8">UTF-8</option>
              <option value="GBK">GBK</option>
            </select>
          </div>

          <!-- 输入框：待加密文本或待解密 Base64 字符串 -->
          <textarea v-model="input" class="input-area" spellcheck="false" placeholder="请输入待加密或解密的文本"></textarea>

          <!-- 错误提示：解码失败等异常信息 -->
          <div v-if="error" class="error-msg">{{ error }}</div>
        </div>
      </section>

      <!-- 拖拽分割条：桌面端竖条拖宽度、移动端横条拖高度 -->
      <div class="resizer" :class="{ dragging: resizing }" @pointerdown="startResize"></div>

      <!-- 结果面板：展示加密/解密结果 -->
      <section class="preview">
        <div class="pane-title"><span>结果区</span></div>
        <div class="preview-scroll">
          <textarea v-if="output" v-model="output" readonly spellcheck="false" class="output-area"></textarea>
          <div v-else class="empty-hint">输入内容后点击「提交」即可获得结果</div>
        </div>
      </section>
    </main>

    <!-- 底部状态栏：操作结果 / 错误提示 -->
    <div class="status-bar" :class="{ error: !!error }">{{ status }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import * as Encoding from 'encoding-japanese' // 用于 GBK 编码/解码
import { copyText } from '../../composables/useClipboard'
import { useToolStandalone } from '../../composables/useToolStandalone'
import { useSplitPane } from '../../composables/useSplitPane'

/* ---------- 输入/输出状态 ---------- */
const mode = ref('encode')   // encode 加密 | decode 解密
const charset = ref('UTF-8') // UTF-8 | GBK
const input = ref('')        // 输入文本
const output = ref('')       // 加密/解密结果
const error = ref('')        // 错误提示
const status = ref('就绪')   // 底部状态栏文案

/* ---------- 清空：重置输入、结果与所有状态 ---------- */
function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
  status.value = '已清空'
}

/* ---------- 隐藏站点全局导航栏（tool-standalone 模式） ---------- */
useToolStandalone()

/* ---------- 加密/解密 ---------- */
// 入口：按当前模式与字符编码执行编码或解码，结果写入 output，异常写入 error
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

// 字节数组 -> Base64 字符串
// 自实现而非 btoa：btoa 要求字符串字符在 Latin1 范围（0-255），
// 中文/emoji 等多字节字符会抛错，逐字节手写则不受限制
function bytesToBase64(bytes) {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let out = ''
  // 每 3 个字节编码为 4 个 Base64 字符，不足 3 字节时补 '='
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

// Base64 字符串 -> 字节数组
// 自实现而非 atob：与编码对称，保证与 bytesToBase64 完全互逆
function base64ToBytes(b64) {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const map = Object.create(null)
  for (let i = 0; i < CHARS.length; i++) map[CHARS[i]] = i
  const clean = b64.replace(/[^A-Za-z0-9+/=]/g, '') // 忽略空白等非法字符
  const bytes = []
  let buffer = 0
  let bits = 0
  // 每 4 个 Base64 字符解码为 3 个字节，遇 '=' 结束
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
  // GBK：先把 Unicode 码点数组转成 GBK 字节数组，再做 Base64
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
  // GBK：字节数组先转回 Unicode 码点，再还原为字符串
  const unicodeArray = Encoding.convert(byteArray, { to: 'UNICODE', from: 'GBK' })
  return Encoding.codeToString(unicodeArray)
}

/* ---------- 互换输入输出 ---------- */
// 把结果回填到输入区、清空结果，并自动切换加密/解密模式，便于往返验证
function swap() {
  if (!output.value) return
  input.value = output.value
  output.value = ''
  mode.value = mode.value === 'encode' ? 'decode' : 'encode'
  status.value = '已互换输入输出，可点击提交'
}

/* ---------- 复制结果 ---------- */
// 复制主逻辑封装在 useClipboard：优先 Clipboard API，失败/不可用降级到 execCommand
async function copyOutput() {
  if (!output.value) return
  const ok = await copyText(output.value)
  // 复制结果反馈到底部状态栏
  status.value = ok ? '复制成功 ✓ ' + new Date().toLocaleTimeString() : '复制失败，请手动选择复制'
}

/* ---------- 拖拽分割（桌面左右 / 移动上下） ---------- */
const { mainRef, paneStyle, resizing, startResize } = useSplitPane()
</script>

<style scoped>
/* ---------- 根布局：纵向 flex，占满视口且禁止整页滚动 ---------- */
.base64-codec {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh; /* 移动端地址栏收起时仍占满可视区 */
  overflow: hidden; /* 页面固定，只允许面板内部滚动 */
  overscroll-behavior: none; /* 阻止滚动链与橡皮筋 */
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
  margin-left: auto; /* 按钮组靠右 */
}

/* ---------- 通用按钮 ---------- */
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

/* ---------- 主区域：桌面横向 flex（输入 | 拖拽条 | 结果） ---------- */
main {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0; /* 允许收缩，防止面板内容把整页撑出滚动 */
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
  width: 50%; /* 桌面默认宽度，拖拽后由内联 style 覆盖 */
  border-right: none;
}

/* 桌面端忽略内联 height（paneStyle 同时输出 width/height，桌面只用 width） */
@media (min-width: 761px) {
  .editor {
    height: auto !important;
  }
}

.preview {
  flex: 1 1 0; /* 占据拖拽条右侧的剩余宽度 */
}

/* ---------- 拖拽分割条 ---------- */
.resizer {
  width: 5px;
  flex: 0 0 5px;
  cursor: col-resize;
  background: var(--border);
  transition: background .15s;
  touch-action: none; /* 禁止浏览器接管该元素手势（滚动/缩放），保证指针拖动持续触发 */
}

.resizer:hover,
.resizer.dragging {
  background: var(--accent);
}

/* ---------- 面板标题条 ---------- */
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

/* ---------- 标题条链接（清空等） ---------- */
.link {
  color: var(--accent);
  cursor: pointer;
  font-size: 12px;
}

.link:hover {
  text-decoration: underline;
}

/* ---------- 输入面板内容 ---------- */
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

/* ---------- 输入/输出文本框 ---------- */
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
  color: var(--success, #0f6b38); /* 结果用成功色区分 */
}

/* ---------- 错误提示 ---------- */
.error-msg {
  margin-top: 12px;
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
  padding: 16px;
  background: var(--panel);
}

.empty-hint {
  color: var(--muted);
  text-align: center;
  margin: auto;
  font-size: 14px;
}

/* ---------- 底部状态栏 ---------- */
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

/* ---------- 移动端：上下布局（输入 | 拖拽条 | 结果） ---------- */
@media (max-width: 760px) {
  .base64-codec {
    /* 固定定位替代 100vh：企微等内置浏览器地址栏收起/展开时高度不抖动 */
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
    width: 100% !important; /* 覆盖内联 width 的优先级，输入区占满屏幕宽度 */
    flex: none;
    min-height: 0; /* 高度由内联 style 控制（topHeight%） */
  }

  .preview {
    flex: 1 1 0; /* 占据拖拽条下方的剩余高度 */
    min-height: 0;
  }

  .resizer {
    /* 移动端改为横向拖拽条：上下拖动调整输入区/结果区高度 */
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
