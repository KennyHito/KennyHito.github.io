<!-- ===== 资讯页 NewsPage：左侧目录 + 右侧资讯内容（含水印） ===== -->

<template>
  <!-- 资讯页主容器：左侧固定目录 + 右侧资讯列表（移动端改为顶部横向目录） -->
  <section class="page-section page-root">
    <div class="container news-layout">
      <!-- 桌面端（>860px）：固定在屏幕左侧的年月日目录，点击平滑定位到对应日期分组；支持横向展开/收起 -->
      <aside ref="tocEl" class="toc" :class="{ 'toc-closed': !tocOpen }" :style="tocStyle" aria-label="资讯日期目录">
        <h4 class="toc-title">目录</h4>
        <ul class="toc-list">
          <li v-for="g in newsGroups" :key="g.date">
            <a class="toc-link" href="#" @click.prevent="scrollToDate(g.date)">{{ g.date }}</a>
          </li>
        </ul>
      </aside>

      <!-- 目录拖拽条（桌面端）：位于目录右侧垂直居中，点击切换开合，长按水平拖拽可伸缩目录（松手吸附） -->
      <div class="toc-handle" :style="handleStyle" role="button" tabindex="0" :aria-expanded="tocOpen"
        aria-label="展开或收起目录" @pointerdown="onHandlePointerDown" @keydown.enter.prevent="tocOpen = !tocOpen"
        @keydown.space.prevent="tocOpen = !tocOpen">
        <AppIcon name="chevron-left" :size="10" class="toc-handle-icon"
          :class="{ 'toc-handle-icon-closed': !tocOpen }" />
      </div>

      <!-- 目录收起提示：拖拽条右侧显示「点击或拖拽可展开」，拖拽时自动隐藏 -->
      <TocCollapsedHint :toc-open="tocOpen" :dragging="isDragging" />

      <!-- 主内容区：资讯列表 -->
      <div class="news-main">
        <!-- 移动端（≤860px）：顶部横向滚动的日期胶囊，点击同样平滑定位 -->
        <nav class="toc-mobile" aria-label="资讯日期目录">
          <a v-for="g in newsGroups" :key="'m' + g.date" class="toc-mobile-item" href="#"
            @click.prevent="scrollToDate(g.date)">{{ g.date }}</a>
        </nav>

        <!-- 每个日期分组一个锚点，scrollIntoView 定位时避开吸顶导航 -->
        <div v-for="(g, i) in newsGroups" :key="g.date + i" :id="'news-' + g.date" class="news-anchor">
          <NewsPanel :group="g" />
        </div>
      </div>
    </div>
  </section>

  <!-- 资讯水印：覆盖层，半透明、不阻挡交互。文字用真实 DOM 渲染，
       字体继承全局 --font-sans（只改 style.css 一处即可统一水印字体）；
       行间距密度由 style.css 中 --watermark-scale 控制 -->
  <div class="news-watermark" aria-hidden="true">
    <div class="news-watermark-row" v-for="r in 5" :key="'r' + r">
      <div class="news-watermark-cell" v-for="c in 3" :key="'c' + c">
        <span class="news-watermark-cn">本资讯由AI智能生成，若涉及侵权，敬请联系予以删除。</span>
        <span class="news-watermark-en">This information is AI-generated. Please contact us for removal in case of any
          copyright infringement.</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { newsGroups } from '../data/news.js'
import AppIcon from '../components/AppIcon.vue'
import NewsPanel from '../components/NewsPanel.vue'
import { useTocDrag } from '../composables/useTocDrag.js'
import TocCollapsedHint from '../components/TocCollapsedHint.vue'

// 引入 Vue API、资讯数据源、目录拖拽组合式函数与页面组件
// 点击目录项，平滑滚动到对应日期分组
function scrollToDate(date) {
  const el = document.getElementById('news-' + date)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 目录元素引用
const tocEl = ref(null)

// 目录展开/收起：点击切换，长按拖拽伸缩（拖拽条固定在目录右侧垂直居中）
const { tocOpen, tocStyle, handleStyle, onHandlePointerDown, isDragging } = useTocDrag()

// 目录上滚动：始终阻止默认行为（避免穿透滚动资讯/页面），手动滚动年月日列表本身
function onTocWheel(e) {
  const el = tocEl.value
  if (!el) return
  // 列表是唯一可滚动区域，标题固定不动
  const list = el.querySelector('.toc-list')
  if (!list) return
  // 手动累加滚动距离；内容不足时 scrollTop 会自动钳制在 0 ~ 最大值之间
  list.scrollTop += e.deltaY
  e.preventDefault()
}

onMounted(() => {
  if (tocEl.value) tocEl.value.addEventListener('wheel', onTocWheel, { passive: false })
})
onUnmounted(() => {
  if (tocEl.value) tocEl.value.removeEventListener('wheel', onTocWheel)
})
</script>

<style scoped>
/* 顶部导航栏占位由全局 .page-root 统一提供，此处无需重复 */

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
  padding: 0 66px;
}

@media (max-width: 1264px) {
  .news-main {
    flex: 1;
    min-width: 0;
    padding: 0px 0px;
  }
}

/* 每个日期分组锚点：scrollIntoView 定位时避开吸顶导航 */
.news-anchor {
  scroll-margin-top: 72px;
}

/* ===== 资讯页专属：日期分组锚点（避开吸顶导航）与资讯水印样式 =====
   目录容器、拖拽条、列表、链接、移动端胶囊等共享样式已统一移至 style.css（.toc*） */

/* 资讯水印：固定全屏、DOM 文本平铺、整体旋转 -15° 并放大覆盖。
   文字字体继承全局 --font-sans（改 style.css 一处即可统一水印字体），
   颜色用半透明文字、通过 color 继承，亮/暗主题自动适配 */
.news-watermark {
  position: fixed;
  inset: 0;
  z-index: 1;
  /* 不阻挡下方内容的点击与交互 */
  pointer-events: none;
  overflow: hidden;
  /* 旋转 -15° 并放大，确保旋转后仍覆盖整个视口 */
  transform: rotate(-15deg) scale(1.35);
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  /* 行间距：由全局 --watermark-scale 控制（默认 1），数值越大越疏、越小越密 */
  gap: calc(24px * var(--watermark-scale, 1));
  /* 水印文字颜色（半透明），暗色主题通过下方覆盖切换 */
  color: rgba(0, 0, 0, 0.1);
  /* 水印字体：读取全局 --font-sans（楷体） */
  font-family: var(--font-sans);
}

/* 暗色主题下切换为浅色半透明水印，保持可见性 */
[data-theme="dark"] .news-watermark {
  color: rgba(255, 255, 255, 0.1);
}

/* 每一行：3 格水平均匀分布，中间格完整显示，两侧格允许被视口边缘截断。
   gap 随视口宽度缩放，拉开左右间距（间距大小可手动调整） */
.news-watermark-row {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  gap: 6vw;
}

/* 单元格：中文 + 英文两行垂直排列 */
.news-watermark-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* 中文行：不换行 */
.news-watermark-cn {
  font-size: 11px;
  white-space: nowrap;
}

/* 英文行：允许换行，保证不同屏幕宽度下内容完整显示 */
.news-watermark-en {
  font-size: 11px;
  text-align: center;
  max-width: 500px;
}
</style>
