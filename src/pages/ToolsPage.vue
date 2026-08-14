<template>
  <section class="page-section">
    <div class="container">
      <!-- 每个分类一个独立分区，内部各自使用 useMasonry 瀑布流 -->
      <ToolsSection v-for="c in toolCategories" :key="c.key" :category="c" />
    </div>
  </section>
</template>

<script setup>
import { toolCategories } from '../data/tools.js'
import ToolsSection from '../components/ToolsSection.vue'
</script>
