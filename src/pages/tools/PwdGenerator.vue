<!-- ===== 工具页：随机密码生成器 ===== -->
<template>
  <!-- 根容器：顶栏 + 主区域（配置/结果双面板 + 拖拽条）+ 底部状态栏 -->
  <div class="password-generator">
    <!-- 顶栏：标题 + 操作按钮 -->
    <header>
      <h1><span class="logo">🔐</span> 随机密码生成器</h1>
      <div class="toolbar">
        <button class="primary" @click="generate">🎲 生成随机密码</button>
        <button :disabled="!result" @click="copyResult">📋 复制结果</button>
      </div>
    </header>

    <!-- 主区域：桌面左右布局（配置 | 拖拽条 | 结果），移动端上下布局 -->
    <main ref="mainRef">
      <!-- 配置面板：字符集、密码长度，宽/高由 paneStyle 内联控制 -->
      <section class="controls" :style="paneStyle">
        <div class="pane-title"><span>配置区</span></div>
        <div class="config">
          <!-- 字符集选择：勾选的类型决定生成密码可用的字符范围 -->
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

          <!-- 密码长度：数字输入框与滑块双向联动（1~128） -->
          <div class="row">
            <span class="label">密码长度</span>
            <input class="length-input" type="number" min="1" max="128" v-model.number="length" @change="clampLength" />
          </div>
          <input class="range" type="range" min="1" max="128" v-model.number="length" />

          <!-- 错误提示：如未勾选任何字符类型 -->
          <div v-if="error" class="error-msg">{{ error }}</div>
        </div>
      </section>

      <!-- 拖拽分割条：桌面端竖条拖宽度、移动端横条拖高度 -->
      <div class="resizer" :class="{ dragging: resizing }" @pointerdown="startResize"></div>

      <!-- 结果面板：展示生成的密码，可只读展示与一键复制 -->
      <section class="result">
        <div class="pane-title"><span>结果区</span></div>
        <div class="preview-scroll">
          <textarea v-if="result" v-model="result" readonly spellcheck="false" class="output-area"></textarea>
          <div v-else class="empty-hint">配置后点击「生成随机密码」即可生成</div>
        </div>
      </section>
    </main>

    <!-- 底部状态栏：操作结果 / 错误提示 -->
    <div class="status-bar" :class="{ error: !!error }">{{ status }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { copyText } from '../../composables/useClipboard'
import { useToolStandalone } from '../../composables/useToolStandalone'
import { useSplitPane } from '../../composables/useSplitPane'

/* ---------- 配置状态 ---------- */
const useUpper = ref(true)   // 是否包含大写字母
const useLower = ref(true)   // 是否包含小写字母
const useNumber = ref(true)  // 是否包含数字
const useSpecial = ref(false)// 是否包含特殊字符
const length = ref(12)       // 密码长度（1~128）
const result = ref('')       // 生成的密码结果
const error = ref('')        // 错误提示信息
const status = ref('就绪')   // 底部状态栏文案

/* ---------- 隐藏站点全局导航栏（tool-standalone 模式） ---------- */
useToolStandalone()

/* ---------- 长度约束 ---------- */
// 数字输入框失焦/回车时把长度限制在 1~128
function clampLength() {
  if (!length.value || length.value < 1) length.value = 1
  if (length.value > 128) length.value = 128
}

/* ---------- 生成密码 ---------- */
function generate() {
  error.value = ''
  // 按勾选的字符类型拼接字符集
  let charset = ''
  if (useUpper.value) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (useLower.value) charset += 'abcdefghijklmnopqrstuvwxyz'
  if (useNumber.value) charset += '0123456789'
  if (useSpecial.value) charset += '!@#$%^&*()-_=+[]{};:,.<>?/~'

  // 字符集为空则提示并终止
  if (!charset) {
    error.value = '请至少选择一种字符类型'
    status.value = error.value
    return
  }

  clampLength()
  const len = length.value

  // 使用加密级随机数（crypto.getRandomValues）
  // 取模偏置修正：random() % charset.length 在小字符集下有轻微偏置，
  // 通过「大于最大合法值就重试」的方式保证均匀分布
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
// 复制主逻辑封装在 useClipboard：优先 Clipboard API，失败/不可用降级到 execCommand
async function copyResult() {
  if (!result.value) return
  const ok = await copyText(result.value)
  // 复制结果反馈到底部状态栏
  status.value = ok ? '复制成功 ✓ ' + new Date().toLocaleTimeString() : '复制失败，请手动选择复制'
}

/* ---------- 拖拽分割（桌面左右 / 移动上下） ---------- */
const { mainRef, paneStyle, resizing, startResize } = useSplitPane()
</script>

<style scoped>
/* ---------- 根布局：纵向 flex，占满视口且禁止整页滚动 ---------- */
.password-generator {
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

/* ---------- 主区域：桌面横向 flex（配置 | 拖拽条 | 结果） ---------- */
main {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0; /* 允许收缩，防止面板内容把整页撑出滚动 */
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
  width: 50%; /* 桌面默认宽度，拖拽后由内联 style 覆盖 */
}

/* 桌面端忽略内联 height（paneStyle 同时输出 width/height，桌面只用 width） */
@media (min-width: 761px) {
  .controls {
    height: auto !important;
  }
}

.result {
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
}

/* ---------- 配置面板内容 ---------- */
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
  word-break: break-all; /* 长密码换行显示 */
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

/* ---------- 移动端：上下布局（配置 | 拖拽条 | 结果） ---------- */
@media (max-width: 734px) {
  .password-generator {
    /* 固定定位替代 100vh：企微等内置浏览器地址栏收起/展开时高度不抖动 */
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
    width: 100% !important; /* 覆盖内联 width 的优先级，配置区占满屏幕宽度 */
    flex: none;
    min-height: 0; /* 高度由内联 style 控制（topHeight%） */
  }

  .result {
    flex: 1 1 0; /* 占据拖拽条下方的剩余高度 */
    min-height: 0;
  }

  .resizer {
    /* 移动端改为横向拖拽条：上下拖动调整配置区/结果区高度 */
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
