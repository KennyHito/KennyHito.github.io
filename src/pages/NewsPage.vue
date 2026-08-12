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
  <!-- 资讯页主容器：左侧固定目录 + 右侧资讯列表（移动端改为顶部横向目录） -->
  <section class="page-section">
    <div class="container news-layout">
      <!-- 桌面端（>860px）：固定在屏幕左侧的年月日目录，点击平滑定位到对应日期分组 -->
      <aside ref="tocEl" class="news-toc" aria-label="资讯日期目录">
        <h4 class="news-toc__title">目录</h4>
        <ul class="news-toc__list">
          <li v-for="g in newsGroups" :key="g.date">
            <a class="news-toc__link" href="#" @click.prevent="scrollToDate(g.date)">{{ g.date }}</a>
          </li>
        </ul>
      </aside>

      <!-- 主内容区：资讯列表 -->
      <div class="news-main">
        <!-- 移动端（≤860px）：顶部横向滚动的日期胶囊，点击同样平滑定位 -->
        <nav class="news-toc-mobile" aria-label="资讯日期目录">
          <a v-for="g in newsGroups" :key="'m' + g.date" class="news-toc-mobile__item" href="#"
            @click.prevent="scrollToDate(g.date)">{{ g.date }}</a>
        </nav>

        <!-- 每个日期分组一个锚点，scrollIntoView 定位时避开吸顶导航 -->
        <div v-for="(g, i) in newsGroups" :key="g.date + i" :id="'news-' + g.date" class="news-anchor">
          <NewsPanel :group="g" />
        </div>
      </div>
    </div>
  </section>

  <!-- 资讯水印：覆盖层，半透明、不阻挡交互，颜色自动适配亮/暗主题；密度由 style.css 中 --watermark-scale 控制 -->
  <div class="news-watermark" aria-hidden="true"></div>
</template>

<style scoped>
/* ===== 左右布局：左侧固定目录 + 右侧资讯主内容 ===== */
.news-layout {
  display: flex;
  align-items: flex-start;
  gap: 28px;
}

/* 主内容区（资讯列表）：占满目录之外的剩余宽度 */
.news-main {
  flex: 1;
  min-width: 0;
}

/* 每个日期分组锚点：scrollIntoView 定位时避开吸顶导航 */
.news-anchor {
  scroll-margin-top: 72px;
}

/* ===== 桌面端左侧目录：fixed 固定在屏幕左侧（距左 20px、距顶 60px），
       透明背景可透出水印，内容超出时可滚动但隐藏滚动条 ===== */
.news-toc {
  position: fixed;
  left: 20px;
  top: 60px;
  /* 高于资讯水印，保持可点击 */
  z-index: 2;
  flex-shrink: 0;
  width: 190px;
  /* 最大高度 = 视口高度 - 顶部偏移 - 底部留白（--toc-bottom-offset 可调） */
  max-height: calc(100vh - 118px - var(--toc-bottom-offset));
  /* 内容超出时可滚动，但不显示滚动条（Firefox） */
  overflow-y: auto;
  scrollbar-width: none;
  /* 透明背景，可透出下层资讯水印 */
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

/* ===== 移动端顶部横向目录（默认隐藏，仅窄屏显示） ===== */
.news-toc-mobile {
  display: none;
}

/* 窄屏：隐藏左侧固定目录，改为顶部横向滚动目录 */
@media (max-width: 860px) {
  .news-toc {
    display: none;
  }

  .news-toc-mobile {
    display: flex;
    gap: 8px;
    margin-bottom: 18px;
    padding-bottom: 6px;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .news-toc-mobile::-webkit-scrollbar {
    display: none;
  }

  .news-toc-mobile__item {
    flex-shrink: 0;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-size: 13px;
    opacity: 0.85;
    white-space: nowrap;
    transition: background var(--transition), color var(--transition), opacity var(--transition);
  }

  .news-toc-mobile__item:hover {
    opacity: 1;
    background: var(--bg-secondary);
  }
}

/* 水印覆盖层：固定全屏、使用 SVG 背景图平铺，保证均匀覆盖且左右对称 */
.news-watermark {
  position: fixed;
  inset: 0;
  z-index: 1;
  /* 不阻挡下方内容的点击与交互 */
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='550' height='220' viewBox='0 0 550 220'%3E%3Ctext x='50%25' y='50%25' transform='rotate(-22 230 110)' text-anchor='middle' dominant-baseline='middle' fill='rgba(0,0,0,0.18)' font-size='19' font-family='Kaiti, KaiTi, STKaiti, 楷体, serif'%3E本资讯由AI智能生成，若涉及侵权，敬请联系予以删除。%3C/text%3E%3C/svg%3E");
  background-repeat: repeat;
  /* 平铺单元尺寸：由全局 --watermark-scale 控制（默认 1 = 基准 550x220），
     数值越小水印越密越多，数值越大越疏越少 */
  background-size: calc(550px * var(--watermark-scale, 1)) calc(220px * var(--watermark-scale, 1));
}

/* 暗色主题下切换为浅色半透明水印，保持可见性 */
[data-theme="dark"] .news-watermark {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='550' height='220' viewBox='0 0 550 220'%3E%3Ctext x='50%25' y='50%25' transform='rotate(-22 230 110)' text-anchor='middle' dominant-baseline='middle' fill='rgba(255,255,255,0.18)' font-size='19' font-family='Kaiti, KaiTi, STKaiti, 楷体, serif'%3E本资讯由AI智能生成，若涉及侵权，敬请联系予以删除。%3C/text%3E%3C/svg%3E");
}
</style>
