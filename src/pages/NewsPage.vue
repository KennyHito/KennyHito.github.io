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

  <!-- 资讯水印：覆盖层，半透明、不阻挡交互，颜色自动适配亮/暗主题 -->
  <div class="news-watermark" aria-hidden="true"></div>
</template>

<style scoped>
/* 水印覆盖层：固定全屏、使用 SVG 背景图平铺，保证均匀覆盖且左右对称 */
.news-watermark {
  position: fixed;
  inset: 0;
  z-index: 1;
  /* 不阻挡下方内容的点击与交互 */
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='380' height='220' viewBox='0 0 380 220'%3E%3Ctext x='50%25' y='50%25' transform='rotate(-22 190 110)' text-anchor='middle' dominant-baseline='middle' fill='rgba(0,0,0,0.12)' font-size='18' font-family='system-ui, sans-serif'%3E资讯由AI自动生成，如有侵权，请联系删除。%3C/text%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 380px 220px;
}

/* 暗色主题下切换为浅色半透明水印，保持可见性 */
[data-theme="dark"] .news-watermark {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='380' height='220' viewBox='0 0 380 220'%3E%3Ctext x='50%25' y='50%25' transform='rotate(-22 190 110)' text-anchor='middle' dominant-baseline='middle' fill='rgba(255,255,255,0.12)' font-size='18' font-family='system-ui, sans-serif'%3E资讯由AI自动生成，如有侵权，请联系删除。%3C/text%3E%3C/svg%3E");
}
</style>
