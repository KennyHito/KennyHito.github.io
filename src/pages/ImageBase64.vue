<template>
  <div class="image-base64">
    <header>
      <h1><span class="logo">🖼</span> 图片转 Base64 编码</h1>
      <div class="toolbar">
        <button :disabled="!output" @click="copyOutput">📋 复制结果</button>
        <button :disabled="!canSwap" @click="swap">↔️ 互换</button>
      </div>
    </header>

    <main ref="mainRef">
      <section class="editor" :style="paneStyle">
        <div class="pane-title">
          <span>{{ mode === 'encode' ? '输入图片' : '输入 Base64' }}</span>
          <span>
            <span v-if="fileInfo" class="meta">{{ fileInfo }}</span>
            <template v-if="fileInfo">&nbsp;·&nbsp;</template>
            <span class="link" @click="clearAll">清空</span>
          </span>
        </div>
        <div class="config">
          <!-- 编码模式：上传图片 -->
          <template v-if="mode === 'encode'">
            <label class="upload-zone" @dragover.prevent @drop.prevent="onDrop">
              <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />
              <div v-if="!previewUrl" class="upload-hint">
                <div class="upload-icon">☁️</div>
                <div>点此上传图片或者拖动图片到这里</div>
              </div>
              <img v-else :src="previewUrl" class="preview-img" alt="图片预览" />
            </label>
          </template>
          <!-- 解码模式：粘贴 Base64 -->
          <template v-else>
            <textarea v-model="inputBase64" class="input-area" spellcheck="false"
              placeholder="在此粘贴 Base64 图片数据…"></textarea>
          </template>
          <div v-if="error" class="error-msg">{{ error }}</div>
        </div>
      </section>

      <div class="resizer" :class="{ dragging: resizing }" @pointerdown="startResize"></div>

      <section class="preview">
        <div class="pane-title">
          <span>{{ mode === 'encode' ? 'Base64 结果' : '图片结果' }}</span>
          <span v-if="mode === 'encode'" class="meta">{{ sizeText }}</span>
        </div>
        <div class="preview-scroll">
          <!-- 编码模式：展示 Base64 文本 -->
          <template v-if="mode === 'encode'">
            <textarea v-if="output" v-model="output" readonly spellcheck="false" class="output-area"></textarea>
            <div v-else class="empty-hint">上传图片后即可获得 Base64 编码结果</div>
          </template>
          <!-- 解码模式：展示图片 -->
          <template v-else>
            <img v-if="previewUrl" :src="previewUrl" class="result-img" alt="解码图片" />
            <div v-else class="empty-hint">左侧输入 Base64 图片数据后，结果区将展示解码图片</div>
          </template>
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
const inputBase64 = ref('')   // 当前 Base64 数据
const output = ref('')        // 结果区内容（编码模式下等于 inputBase64）
const previewUrl = ref('')    // 图片预览地址（blob URL 或 Base64 字符串）
const fileName = ref('')      // 上传文件名
const fileSize = ref(0)       // 原文件大小（字节）
const mode = ref('encode')    // 'encode' | 'decode'
const error = ref('')
const status = ref('就绪')
const fileInput = ref(null)

let blobUrl = ''              // 用于释放 FileReader 生成的 ObjectURL

/* ---------- 公共 composable ---------- */
useToolStandalone()
const { mainRef, paneStyle, resizing, startResize } = useSplitPane()

/* ---------- 计算属性 ---------- */
const sizeText = computed(() => {
  if (!fileSize.value) return ''
  return formatSize(fileSize.value)
})

const fileInfo = computed(() => {
  if (!fileName.value) return ''
  return fileName.value + (sizeText.value ? ' · ' + sizeText.value : '')
})

const canSwap = computed(() => {
  return !!(mode.value === 'encode' ? output.value : inputBase64.value)
})

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

/* ---------- 文件上传与自动转换 ---------- */
function onFileChange(e) {
  const f = e.target.files[0]
  if (f) handleFile(f)
}

function onDrop(e) {
  const f = e.dataTransfer.files[0]
  if (f && f.type.startsWith('image/')) {
    handleFile(f)
  } else if (f) {
    error.value = '请上传图片文件'
    status.value = '文件类型不支持'
  }
}

function handleFile(file) {
  error.value = ''
  fileName.value = file.name
  fileSize.value = file.size

  if (blobUrl) URL.revokeObjectURL(blobUrl)
  blobUrl = URL.createObjectURL(file)
  previewUrl.value = blobUrl

  const r = new FileReader()
  r.onload = () => {
    inputBase64.value = r.result
    output.value = r.result
    mode.value = 'encode'
    status.value = '转换成功 ✓ ' + new Date().toLocaleTimeString()
  }
  r.onerror = () => {
    error.value = '图片读取失败'
    status.value = '图片读取失败'
    output.value = ''
  }
  r.readAsDataURL(file)
}

/* ---------- 清空 ---------- */
function clearAll() {
  inputBase64.value = ''
  output.value = ''
  previewUrl.value = ''
  fileName.value = ''
  fileSize.value = 0
  error.value = ''
  mode.value = 'encode'
  if (fileInput.value) fileInput.value.value = ''
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl)
    blobUrl = ''
  }
  status.value = '已清空'
}

/* ---------- 互换输入输出 ---------- */
function swap() {
  error.value = ''
  if (mode.value === 'encode') {
    if (!output.value) return
    mode.value = 'decode'
    previewUrl.value = output.value
    status.value = '已互换：结果区展示图片'
  } else {
    if (!inputBase64.value) return
    mode.value = 'encode'
    output.value = inputBase64.value
    previewUrl.value = inputBase64.value
    status.value = '已互换：结果区展示 Base64'
  }
}

/* ---------- 复制结果 ---------- */
async function copyOutput() {
  if (!output.value) return
  // 解码模式：结果区展示的是图片，优先复制图片本身；环境不支持时降级复制 Base64 文本
  if (mode.value === 'decode') {
    const r = await copyImage()
    if (!r.ok) {
      status.value = '复制失败，请手动选择'
      return
    }
    status.value = r.asImage
      ? '图片已复制 ✓ ' + new Date().toLocaleTimeString()
      : '浏览器不支持直接复制图片，已复制 Base64 文本 ✓ ' + new Date().toLocaleTimeString()
    return
  }
  const ok = await copyText(output.value)
  status.value = ok ? '复制成功 ✓ ' + new Date().toLocaleTimeString() : '复制失败，请手动选择复制'
}

// 将 data URI 手动解析为 Blob（避免 fetch 对 data URI 的兼容/大小限制问题）
function dataUriToBlob(dataUri) {
  const idx = dataUri.indexOf(',')
  const head = dataUri.slice(0, idx)
  const mime = (head.match(/^data:([^;]+)/) || [])[1] || 'image/png'
  const bin = atob(dataUri.slice(idx + 1))
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

// 将结果区图片写入剪贴板：优先复制图片本身，失败时降级复制 Base64 文本
async function copyImage() {
  let blob
  try {
    blob = dataUriToBlob(output.value)
  } catch (e) {
    return { ok: false }
  }
  if (navigator.clipboard && typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      return { ok: true, asImage: true }
    } catch (e) {
      /* 继续降级 */
    }
  }
  try {
    const ok = await copyText(output.value)
    return ok ? { ok: true, asImage: false } : { ok: false }
  } catch (e) {
    return { ok: false }
  }
}
</script>

<style scoped>
/* ---------- 根布局 ---------- */
.image-base64 {
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

/* ---------- 标题条链接（清空） ---------- */
.link {
  color: var(--accent);
  cursor: pointer;
  font-size: 12px;
}

.link:hover {
  text-decoration: underline;
}

/* ---------- 输入面板 ---------- */
.config {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px 20px;
  background: var(--panel);
  gap: 12px;
}

.upload-zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--border);
  border-radius: 12px;
  background: var(--bg);
  cursor: pointer;
  transition: border-color .15s, background .15s;
  overflow: hidden;
  min-height: 0;
}

.upload-zone:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.upload-hint {
  text-align: center;
  color: var(--muted);
  font-size: 14px;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.preview-img,
.result-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.input-area,
.output-area {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 8px;
  outline: none;
  resize: none;
  padding: 16px;
  font-family: var(--font-mono, ui-monospace, Menlo, Consolas, monospace);
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
  background: var(--bg);
  overscroll-behavior: contain;
  min-height: 0;
}

.output-area {
  color: var(--success, #0f6b38);
  word-break: break-all;
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
  padding: 16px;
  background: var(--panel);
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

/* ---------- 移动端 ---------- */
@media (max-width: 760px) {
  .image-base64 {
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
