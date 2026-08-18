<!-- ===== 目录收起提示 TocCollapsedHint =====
   当左侧目录收起时，在拖拽条右上方显示一个气泡，提示用户「点击或拖拽可展开」。
   气泡配色跟随项目主题（表面色 + 文字色 + 边框），箭头从气泡左下角指向拖拽条顶部中心。
   - 仅在桌面端（拖拽条存在时）显示；
   - 跟随拖拽条中心位置（--toc-handle-left）水平/垂直移动；
   - 目录展开或正在拖拽时自动隐藏（按下拖拽条即隐藏）。 -->
<template>
  <Transition name="toc-collapsed-hint">
    <div v-if="!tocOpen && !dragging" class="toc-collapsed-hint" role="tooltip" aria-label="目录已收起，点击或拖拽可展开">
      <span class="toc-collapsed-hint-text">点击 / 拖拽展开目录</span>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  // 目录是否展开：展开时气泡不显示
  tocOpen: {
    type: Boolean,
    required: true,
  },
  // 是否正在拖拽：按下拖拽条即为 true，气泡立即隐藏
  dragging: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
/* 气泡容器：固定定位，与拖拽条共用同一垂直居中公式；
   左边缘对齐拖拽条中心（--toc-handle-left），气泡主体位于拖拽条右上方。 */
.toc-collapsed-hint {
  position: fixed;
  z-index: 50;
  left: var(--toc-handle-left, 20px);
  bottom: calc(100vh - (60px + (100vh - 118px - var(--toc-bottom-offset, 0px)) / 2) + 32px + 6px);
  padding: 8px 14px;
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  font: 500 13px/1.4 var(--font-sans);
  white-space: nowrap;
  pointer-events: none;
  box-shadow: var(--shadow-md);
}

/* 左下箭头：用 border 画直角三角形，从气泡底部左侧（避开左下角圆角）指向拖拽条顶部中心 */
.toc-collapsed-hint::before {
  content: '';
  position: absolute;
  left: 8px;
  bottom: -6px;
  border-style: solid;
  border-width: 6px 6px 0 0;
  border-color: var(--surface) transparent transparent transparent;
}

/* 进入/离开过渡：淡入 + 从左上方向轻微滑入 */
.toc-collapsed-hint-enter-active,
.toc-collapsed-hint-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toc-collapsed-hint-enter-from,
.toc-collapsed-hint-leave-to {
  opacity: 0;
  transform: translate(-6px, -6px);
}

/* 移动端拖拽条隐藏，提示同样不显示 */
@media (max-width: 1264px) {
  .toc-collapsed-hint {
    display: none;
  }
}
</style>
