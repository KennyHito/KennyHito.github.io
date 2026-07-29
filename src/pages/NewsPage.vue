<script setup>
import { newsGroups } from '../data/news.js'
import NewsPanel from '../components/NewsPanel.vue'
</script>

<template>
  <section class="page-section">
    <div class="container">
      <NewsPanel v-for="(g, i) in newsGroups" :key="g.date + i" :group="g" />
    </div>
  </section>
</template>
