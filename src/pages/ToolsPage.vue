<script setup>
import { tools } from '../data/tools.js'
import ToolCard from '../components/ToolCard.vue'
</script>

<template>
  <section class="page-section">
    <div class="container">
      <div class="tools-grid">
        <ToolCard v-for="t in tools" :key="t.key" :tool="t" />
      </div>
    </div>
  </section>
</template>
