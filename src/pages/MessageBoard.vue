<!-- ===== 留言板页 MessageBoard：承载 Giscus 评论（基于 GitHub Discussions） ===== -->
<template>
  <section class="page-section page-root message-board">
    <div class="container">
      <!-- 内容内边距与资讯页 .news-main 保持一致，让视觉宽度对齐 -->
      <div class="mb-main">
        <div class="mb-header">
          <h1 class="mb-title">留言板</h1>
          <!-- 手动刷新评论：Giscus 非实时推送，切换 tab 后点此拉取最新评论。
               直接复用全站 .btn / .btn-secondary 胶囊描边样式，与工具卡按钮同款；
               按钮文字精简为「刷新」，hover 时气泡显示完整「刷新评论」说明 -->
          <button class="btn btn-secondary mb-refresh" type="button" @click="refreshComments" aria-label="刷新评论">
            刷新
            <span class="mb-refresh-tooltip">刷新评论</span>
          </button>
        </div>
        <p class="mb-desc">
          欢迎在此留言、交流或提问。评论需使用 GitHub 账号登录后发表，由 Giscus 基于仓库的 Discussions 承载。
        </p>
        <!-- 全局评论组件：使用 pathname 映射，对应留言页固定讨论串 -->
        <GiscusComments ref="giscusRef" />
      </div>
    </div>
  </section>
</template>

<script setup>
// 引入 Vue 响应式引用
import { ref } from 'vue'
// 引入 Giscus 评论组件
import GiscusComments from '../components/GiscusComments.vue'

// 评论组件实例引用，用于调用其暴露的 refresh 方法
const giscusRef = ref(null)
// 点击刷新按钮：拉取最新评论
function refreshComments() {
  giscusRef.value?.refresh()
}
</script>

<style scoped>
/* 顶部导航栏占位由全局 .page-root 统一提供，此处仅保留底部留白 */
.message-board {
  padding-bottom: 64px;
}

.mb-title {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0;
  text-align: center;
}

/* 标题行容器：标题保持居中；刷新按钮绝对定位钉在右侧，
   脱离文档流，不影响标题居中，读起来像标题行的右侧操作 */
.mb-header {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 0 10px;
}

/* 刷新评论按钮：直接复用全站 .btn / .btn-secondary 胶囊描边样式
   （与工具卡「前往官网」「打开工具」等同款视觉语言）；绝对定位靠右，
   脱离标题居中流，不影响「留言板」标题居中 */
.mb-refresh {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 5px 12px;
  font-size: 12px;
  box-shadow: var(--shadow-sm);
  -webkit-tap-highlight-color: transparent;
}

/* 悬浮提示：按钮文字精简为「刷新」，hover 时气泡显示完整「刷新评论」说明 */
.mb-refresh-tooltip {
  position: absolute;
  right: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%) translateX(6px);
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 13px;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity var(--transition), transform var(--transition), visibility var(--transition);
}

/* 小三角：位于气泡右侧，指向右侧的按钮 */
.mb-refresh-tooltip::after {
  content: '';
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 5px 0 5px 5px;
  border-style: solid;
  border-color: transparent transparent transparent var(--border);
}

.mb-refresh:hover .mb-refresh-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(-50%) translateX(0);
}

.mb-desc {
  font-size: 15px;
  font-family: var(--font-mono, ui-monospace, Menlo, Consolas, monospace);
  line-height: 1.7;
  color: var(--text);
  opacity: 0.8;
  margin: 0 auto 28px;
  text-align: center;
  white-space: nowrap;
}

/* 主内容区：与资讯页 .news-main 保持相同内边距，桌面端两侧缩进、移动端贴边 */
.mb-main {
  padding: 0 66px;
}

@media (max-width: 1264px) {
  .mb-main {
    padding: 0;
  }

  .mb-desc {
    /* 移动端屏幕较窄，恢复自动换行，避免单行溢出 */
    white-space: normal;
  }
}
</style>
