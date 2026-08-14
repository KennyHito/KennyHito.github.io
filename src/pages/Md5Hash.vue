<template>
  <!-- 根容器：顶栏 + 主区域（输入/结果双面板 + 拖拽条）+ 底部状态栏 -->
  <div class="md5-hash">
    <!-- 顶栏：标题 + 操作按钮 -->
    <header>
      <h1><span class="logo">🔒</span> MD5 加密</h1>
      <div class="toolbar">
        <button class="primary" @click="submit" :disabled="!input.trim()">🖱 在线MD5加密</button>
        <button :disabled="!output" @click="copyOutput">📋 复制结果</button>
      </div>
    </header>

    <!-- 主区域：桌面左右布局（输入 | 拖拽条 | 结果），移动端上下布局 -->
    <main ref="mainRef">
      <!-- 输入面板：宽/高由 paneStyle 内联控制 -->
      <section class="editor" :style="paneStyle">
        <div class="pane-title">
          <span>内容</span>
          <!-- 清空输入与结果 -->
          <span class="link" @click="clearAll">清空</span>
        </div>
        <div class="config">
          <textarea v-model="input" class="input-area" spellcheck="false" placeholder="请输入待加密的内容"></textarea>
        </div>
      </section>

      <!-- 拖拽分割条：桌面端竖条拖宽度、移动端横条拖高度 -->
      <div class="resizer" :class="{ dragging: resizing }" @pointerdown="startResize"></div>

      <!-- 结果面板：展示 MD5 结果 -->
      <section class="preview">
        <div class="pane-title"><span>结果</span></div>
        <div class="preview-scroll">
          <textarea v-if="output" v-model="output" readonly spellcheck="false" class="output-area"></textarea>
          <div v-else class="empty-hint">输入内容后点击「在线MD5加密」即可获得结果</div>
        </div>
      </section>
    </main>

    <!-- 底部状态栏：操作结果 / 错误提示 -->
    <div class="status-bar" :class="{ error: !!error }">{{ status }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import md5 from 'js-md5' // 浏览器端 MD5 计算库
import { copyText } from '../composables/useClipboard'
import { useToolStandalone } from '../composables/useToolStandalone'
import { useSplitPane } from '../composables/useSplitPane'

/* ---------- 输入/输出状态 ---------- */
const input = ref('')        // 待加密内容
const output = ref('')       // MD5 结果（32 位小写）
const error = ref('')        // 错误提示
const status = ref('就绪')   // 底部状态栏文案

/* ---------- 隐藏站点全局导航栏（tool-standalone 模式） ---------- */
useToolStandalone()

/* ---------- MD5 加密 ---------- */
function submit() {
  error.value = ''
  const text = input.value
  if (!text.trim()) {
    status.value = '请输入内容'
    output.value = ''
    return
  }

  try {
    output.value = md5(text)
    status.value = '加密成功 ✓ ' + new Date().toLocaleTimeString()
  } catch (e) {
    error.value = e.message || '加密失败'
    status.value = error.value
  }
}

/* ---------- 清空：重置输入、结果与所有状态 ---------- */
function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
  status.value = '已清空'
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
.md5-hash {
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
  font-family: var(--font-mono, ui-monospace, Menlo, Consolas, monospace);
  word-break: break-all;
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
  .md5-hash {
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

  .input-area,
  .output-area {
    font-size: 15px;
  }
}
</style>
