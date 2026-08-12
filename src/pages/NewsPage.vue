<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { newsGroups } from '../data/news.js'
import NewsPanel from '../components/NewsPanel.vue'

// 点击目录项，平滑滚动到对应日期分组
function scrollToDate(date) {
  const el = document.getElementById('news-' + date)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 目录元素引用
const tocEl = ref(null)

// 目录上滚动：目录可滚动时只滚目录；到顶/底部边界时阻止滚动穿透到资讯
function onTocWheel(e) {
  const el = tocEl.value
  if (!el) return
  const { scrollTop, scrollHeight, clientHeight } = el
  const atTop = scrollTop <= 0
  const atBottom = scrollTop + clientHeight >= scrollHeight
  if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
    e.preventDefault()
  }
}

onMounted(() => {
  if (tocEl.value) tocEl.value.addEventListener('wheel', onTocWheel, { passive: false })
})
onUnmounted(() => {
  if (tocEl.value) tocEl.value.removeEventListener('wheel', onTocWheel)
})
</script>

<template>
  <section class="page-section">
    <div class="container news-layout">
      <!-- 左侧：资讯列表 -->
      <div class="news-main">
        <div v-for="(g, i) in newsGroups" :key="g.date + i" :id="'news-' + g.date" class="news-anchor">
          <NewsPanel :group="g" />
        </div>
      </div>

      <!-- 右侧：年月日目录 -->
      <aside ref="tocEl" class="news-toc" aria-label="资讯日期目录">
        <h4 class="news-toc__title">目录</h4>
        <ul class="news-toc__list">
          <li v-for="g in newsGroups" :key="g.date">
            <a class="news-toc__link" href="#"
              @click.prevent="scrollToDate(g.date)">{{ g.date }}</a>
          </li>
        </ul>
      </aside>
    </div>
  </section>

  <!-- 资讯水印：覆盖层，半透明、不阻挡交互，颜色自动适配亮/暗主题 -->
  <div class="news-watermark" aria-hidden="true"></div>
</template>

<style scoped>
/* ===== 左右布局：左侧资讯，右侧年月日目录 ===== */
.news-layout {
  display: flex;
  align-items: flex-start;
  gap: 28px;
}

/* 左侧资讯列表：占满剩余宽度 */
.news-main {
  flex: 1;
  min-width: 0;
}

/* 每个日期分组锚点：滚动定位时避开吸顶导航 */
.news-anchor {
  scroll-margin-top: 72px;
}

/* ===== 左侧目录：固定在屏幕最左，左侧留 40px，顶部与主内容区对齐 ===== */
.news-toc {
  position: fixed;
  left: 20px;
  top: 60px;
  z-index: 2;
  /* 高于资讯水印，保持可读 */
  flex-shrink: 0;
  width: 190px;
  max-height: calc(100vh - 118px - var(--toc-bottom-offset));
  /* 内容超出时可滚动，但不显示滚动条 */
  overflow-y: auto;
  scrollbar-width: none;
  background: transparent;
  border: none;
  padding: 16px 14px;
}

/* Webkit 内核隐藏滚动条（Chrome / Safari） */
.news-toc::-webkit-scrollbar {
  display: none;
}

.news-toc__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--title);
  margin-bottom: 10px;
  padding: 0 6px;
}

.news-toc__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.news-toc__link {
  display: block;
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text);
  opacity: 0.82;
  transition: background var(--transition), color var(--transition), opacity var(--transition);
}

.news-toc__link:hover {
  opacity: 1;
  background: var(--bg-secondary);
}

/* 窄屏隐藏目录，避免遮挡内容 */
@media (max-width: 860px) {
  .news-toc {
    display: none;
  }
}

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
