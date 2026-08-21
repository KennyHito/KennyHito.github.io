<!-- ===== 工具页：二维码生成器 ===== -->
<template>
  <!-- 根容器：顶栏 + 主区域（配置/预览双面板）+ 底部状态栏 -->
  <div class="qr-generator">
    <!-- 顶栏：标题 + 操作按钮 -->
    <header>
      <h1><span class="logo">🔗</span> 二维码生成器</h1>
      <div class="toolbar">
        <button class="primary" :disabled="!hasContent" @click="download">📥 下载 PNG</button>
        <button :disabled="!hasContent" @click="copyImage">📋 复制图片</button>
      </div>
    </header>

    <!-- 主区域：桌面左右布局（配置 | 拖拽条 | 预览），移动端上下布局 -->
    <main ref="mainRef">
      <!-- 配置面板：内容、尺寸、纠错级别、边距（宽度/高度由拖拽分割控制） -->
      <section class="controls" :style="paneStyle">
        <div class="pane-title">
          <span>配置区</span>
          <span>
            <span class="link" @click="loadSample">载入示例</span>
            &nbsp;·&nbsp;
            <span class="link" @click="clearAll">清空</span>
          </span>
        </div>
        <div class="config">
          <!-- 内容输入 -->
          <label class="field-label">内容（文本 / 链接）</label>
          <textarea v-model="text" class="content-input" rows="4" spellcheck="false"
            placeholder="输入要生成二维码的文本或链接，如 https://devnote.site"></textarea>

          <!-- 尺寸 -->
          <div class="row">
            <span class="label">尺寸</span>
            <input class="num-input" type="number" min="128" max="512" step="16" v-model.number="size"
              @change="clampSize" />
            <span class="unit">px</span>
          </div>
          <input class="range" type="range" min="128" max="512" step="16" v-model.number="size" />

          <!-- 纠错级别 -->
          <div class="row">
            <span class="label">纠错级别</span>
            <select v-model="errorLevel" class="select">
              <option value="L">L - 约 7% 可被遮挡</option>
              <option value="M">M - 约 15% 可被遮挡</option>
              <option value="Q">Q - 约 25% 可被遮挡</option>
              <option value="H">H - 约 30% 可被遮挡</option>
            </select>
          </div>

          <!-- 边距 -->
          <div class="row">
            <span class="label">边距</span>
            <input class="num-input" type="number" min="0" max="10" v-model.number="margin" @change="clampMargin" />
            <span class="unit">格</span>
          </div>
          <input class="range" type="range" min="0" max="10" v-model.number="margin" />

          <!-- 错误提示 -->
          <div v-if="error" class="error-msg">{{ error }}</div>
          <p class="hint">内容越多、纠错级别越高，二维码模块越密。全部在浏览器本地生成，内容不会上传。</p>
        </div>
      </section>

      <!-- 拖拽分割条：桌面左右拖拽调宽度，移动端上下拖拽调高度 -->
      <div class="resizer" :class="{ dragging: resizing }" @pointerdown="startResize"></div>

      <!-- 预览面板：二维码实时渲染 -->
      <section class="preview">
        <div class="pane-title"><span>预览区</span></div>
        <div class="preview-body">
          <div class="canvas-wrap" :class="{ empty: !hasContent }">
            <canvas v-show="hasContent" ref="canvasRef"></canvas>
            <div v-if="!hasContent" class="empty-hint">输入内容后自动生成二维码</div>
          </div>
        </div>
      </section>
    </main>

    <!-- 底部状态栏 -->
    <div class="status-bar" :class="{ error: !!error }">{{ status }}</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import QRCode from 'qrcode'
import { useToolStandalone } from '../../composables/useToolStandalone'
import { useSplitPane } from '../../composables/useSplitPane'
import { site } from '../../data/site'

/* ---------- 拖拽分割（桌面左右 / 移动上下） ---------- */
const { mainRef, paneStyle, resizing, startResize } = useSplitPane()

/* ---------- 配置状态 ---------- */
// 默认内容与「载入示例」均读取 site.js 中的站点地址（site.devnote），保持单一数据源
const text = ref(site.devnote)            // 二维码内容
const size = ref(256)                    // 生成尺寸（128~512）
const errorLevel = ref('M')              // 纠错级别 L/M/Q/H
const margin = ref(2)                    // 边距（模块数）
const canvasRef = ref(null)              // 预览 canvas
const error = ref('')                    // 错误提示
const status = ref('就绪')               // 底部状态栏文案

/* ---------- 隐藏站点全局导航栏（tool-standalone 模式） ---------- */
useToolStandalone()

/* ---------- 派生状态 ---------- */
const hasContent = computed(() => text.value.trim().length > 0)

/* ---------- 输入约束 ---------- */
function clampSize() {
  if (!size.value || size.value < 128) size.value = 128
  if (size.value > 512) size.value = 512
}
function clampMargin() {
  if (!margin.value && margin.value !== 0) margin.value = 0
  if (margin.value < 0) margin.value = 0
  if (margin.value > 10) margin.value = 10
}

/* ---------- 实时生成（防抖 250ms） ---------- */
let timer = null
let clearGuard = false // 清空操作守卫：阻止本次渲染把「已清空」状态覆盖掉
function render() {
  clearTimeout(timer)
  timer = setTimeout(async () => {
    const content = text.value.trim()
    if (!content) {
      if (clearGuard) {
        clearGuard = false
        return // 点击清空触发的渲染：保留「已清空」状态
      }
      error.value = '请输入要生成二维码的内容'
      status.value = error.value
      return
    }
    clearGuard = false
    error.value = ''
    try {
      // 纯前端渲染到 canvas，不发起任何网络请求
      await QRCode.toCanvas(canvasRef.value, content, {
        width: size.value,
        margin: margin.value,
        errorCorrectionLevel: errorLevel.value
      })
      status.value = '二维码已生成，可下载 PNG 或复制图片'
    } catch (e) {
      error.value = '生成失败：' + (e.message || e)
      status.value = error.value
    }
  }, 250)
}

watch([text, size, errorLevel, margin], render)
onMounted(render)

/* ---------- 清空：内容清空，配置项恢复默认 ---------- */
function clearAll() {
  clearGuard = true
  clearTimeout(timer)
  text.value = ''
  size.value = 256
  errorLevel.value = 'M'
  margin.value = 2
  error.value = ''
  status.value = '已清空'
}

/* ---------- 载入示例：填入站点地址（读取 site.js 配置） ---------- */
function loadSample() {
  text.value = site.devnote
  size.value = 256
  errorLevel.value = 'M'
  margin.value = 2
  status.value = '已载入示例'
}

/* ---------- 下载 PNG ---------- */
function download() {
  const canvas = canvasRef.value
  if (!canvas || !hasContent.value) return
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = 'qrcode_' + Date.now() + '.png'
  a.click()
  status.value = '已下载 PNG 图片 ✓'
}

/* ---------- 复制图片到剪贴板 ---------- */
async function copyImage() {
  const canvas = canvasRef.value
  if (!canvas || !hasContent.value) return
  canvas.toBlob(async (blob) => {
    if (!blob) {
      status.value = '复制失败，请改用下载'
      return
    }
    try {
      // ClipboardItem 需要较新浏览器；失败时降级提示使用下载
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      status.value = '图片已复制到剪贴板 ✓'
    } catch (e) {
      status.value = '当前浏览器不支持复制图片，请使用「下载 PNG」'
    }
  })
}
</script>

<style scoped>
/* ---------- 根布局：纵向 flex，占满视口且禁止整页滚动 ---------- */
.qr-generator {
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

/* ---------- 通用按钮 ---------- */
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

/* ---------- 主区域：桌面横向 flex（配置 | 预览） ---------- */
main {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.controls,
.preview {
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.controls {
  flex: none;
  width: 50%;
  border-right: none;
}

/* 桌面端忽略内联 height（paneStyle 同时输出 width/height，桌面只用 width） */
@media (min-width: 761px) {
  .controls {
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
  /* 禁止浏览器接管该元素手势（滚动/缩放），保证指针拖动持续触发 */
  touch-action: none;
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

.link {
  color: var(--accent);
  cursor: pointer;
  font-size: 12px;
}

.link:hover {
  text-decoration: underline;
}

/* ---------- 配置面板内容 ---------- */
.config {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px 20px;
  background: var(--panel);
  gap: 6px;
}

.field-label {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 4px;
}

.content-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 7px;
  font: inherit;
  font-size: 14px;
  background: var(--bg);
  color: var(--text);
  resize: vertical;
  min-height: 84px;
  margin-bottom: 10px;
}

.content-input:focus {
  outline: none;
  border-color: var(--accent);
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.label {
  font-size: 13px;
  color: var(--text);
  flex: none;
}

.num-input {
  width: 68px;
  padding: 5px 8px;
  border: 1px solid var(--border);
  border-radius: 7px;
  font: inherit;
  font-size: 13px;
  background: var(--bg);
  color: var(--text);
  text-align: center;
}

.unit {
  font-size: 12px;
  color: var(--muted);
}

.range {
  width: 100%;
  accent-color: var(--accent);
  margin-bottom: 12px;
}

.select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 7px;
  font: inherit;
  font-size: 13px;
  background: var(--bg);
  color: var(--text);
}

.hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.6;
}

/* ---------- 错误提示 ---------- */
.error-msg {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 7px;
  background: var(--error-bg, rgba(244, 67, 54, .1));
  color: var(--error);
  font-size: 13px;
}

/* ---------- 预览面板 ---------- */
.preview-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--panel);
  overflow: hidden;
}

.canvas-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  min-height: 220px;
}

.canvas-wrap canvas {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  background: #fff;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, .12));
}

.empty-hint {
  color: var(--muted);
  text-align: center;
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

/* ---------- 移动端：上下布局（配置 | 预览） ---------- */
@media (max-width: 734px) {
  .qr-generator {
    position: fixed;
    inset: 0;
    height: auto;
    overscroll-behavior: none;
  }

  main {
    flex-direction: column;
  }

  .controls {
    border-right: none;
    border-bottom: 1px solid var(--border);
    /* 覆盖内联 width（leftWidth%）的优先级，移动端配置区占满屏幕宽度 */
    width: 100% !important;
    /* 高度由内联 style 控制（topHeight%），不参与 flex 伸缩 */
    flex: none;
    min-height: 0;
  }

  .preview {
    flex: 1 1 0;
    min-height: 0;
  }

  .resizer {
    /* 移动端水平拖拽条：上下拖动调整配置区/预览区高度 */
    width: 100%;
    height: 14px;
    flex: 0 0 14px;
    cursor: row-resize;
    touch-action: none;
  }

  .canvas-wrap {
    min-height: 0;
  }
}
</style>
