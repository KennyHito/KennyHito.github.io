<script setup>
import { ref } from 'vue'
import { tools } from '../data/tools.js'
import ToolCard from '../components/ToolCard.vue'
import { useMasonry } from '../composables/useMasonry.js'

const gridRef = ref(null)
// 使用瀑布流 composable：自动按内容高度紧密排列卡片
useMasonry(gridRef, { gap: 20, maxCols: 2 })

</script>

<template>
  <section class="page-section">
    <div class="container">
      <div ref="gridRef" class="tools-grid">
        <ToolCard v-for="t in tools" :key="t.key" :tool="t" />
      </div>
    </div>
  </section>
</template>

<style scoped>
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
}
</style>
