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
.tools-grid {
  position: relative;
}
</style>
