<!-- ===== 工具分类分区 ToolsSection：渲染一类工具（标题 + 瀑布流卡片） ===== -->
<template>
  <div class="tools-section" :id="'tools-section-' + category.key">
    <div class="section-head">
      <h2 :style="{ '--section-accent': category.color }">{{ category.title }}</h2>
      <p v-if="category.desc">{{ category.desc }}</p>
    </div>
    <div ref="gridRef" class="tools-grid">
      <!-- 每个工具一个锚点容器，供左侧目录点击平滑定位 -->
      <div v-for="t in category.tools" :key="t.key" :id="'tool-' + t.key" class="tool-anchor">
        <ToolCard :tool="t" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ToolCard from './ToolCard.vue'
import { useMasonry } from '../composables/useMasonry.js'

// 接收单个工具分类（标题、描述、color 与 tools 列表）
defineProps({
  category: { type: Object, required: true }
})

const gridRef = ref(null)
// 每个分类分区独立使用瀑布流：按内容高度紧密排列卡片
useMasonry(gridRef, { gap: 20, maxCols: 2 })
</script>

<style scoped>
/* 分类分区：上下留白，最后一个分区不再追加间距；顶部预留导航高度供锚点定位 */
.tools-section {
  margin-bottom: 48px;
  scroll-margin-top: 72px;
}

.tools-section:last-child {
  margin-bottom: 0;
}

/* 工具锚点容器：高度跟随内部卡片；顶部预留导航高度供目录点击定位 */
.tool-anchor {
  scroll-margin-top: 72px;
}

/* 分区标题（左对齐） */
.section-head {
  text-align: left;
  margin-bottom: 22px;
}

.section-head h2 {
  /* 给左侧竖线预留位置 */
  position: relative;
  padding-left: 16px;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* 标题左侧彩色竖线，颜色由分类的 color 字段决定（默认强调色） */
.section-head h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 0.95em;
  border-radius: 3px;
  background: var(--section-accent, var(--accent));
}

.section-head p {
  color: var(--text);
  opacity: 0.8;
  font-size: 15px;
  margin-top: 8px;
}

/* 工具瀑布流容器：useMasonry 会按内容高度绝对定位排列卡片。
   grid 定义作为兜底布局（JS 未执行时仍显示两列）；
   position: relative 供绝对定位卡片作定位参照 */
.tools-grid {
  display: grid;
  /* 两列等宽（兜底） */
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  position: relative;
}

@media (max-width: 734px) {
  /* 窄屏兜底单列 */
  .tools-grid {
    grid-template-columns: 1fr;
  }

  .section-head h2 {
    font-size: 22px;
  }
}
</style>
