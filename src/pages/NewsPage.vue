<template>
  <!-- 资讯页主容器：左侧固定目录 + 右侧资讯列表（移动端改为顶部横向目录） -->
  <section class="page-section">
    <div class="container news-layout">
      <!-- 桌面端（>860px）：固定在屏幕左侧的年月日目录，点击平滑定位到对应日期分组；支持横向展开/收起 -->
      <aside ref="tocEl" class="news-toc" :class="{ 'news-toc-closed': !tocOpen }" aria-label="资讯日期目录">
        <h4 class="news-toc-title">目录</h4>
        <ul class="news-toc-list">
          <li v-for="g in newsGroups" :key="g.date">
            <a class="news-toc-link" href="#" @click.prevent="scrollToDate(g.date)">{{ g.date }}</a>
          </li>
        </ul>
      </aside>

      <!-- 目录展开/收起切换按钮（桌面端）：展开时贴在目录右侧，收起时回到屏幕左边缘 -->
      <button class="news-toc-toggle" :class="{ 'news-toc-toggle-closed': !tocOpen }" @click="tocOpen = !tocOpen"
        aria-label="展开或收起目录" :aria-expanded="tocOpen">
        <AppIcon name="chevron-left" :size="14" class="news-toc-toggle-icon"
          :class="{ 'news-toc-toggle-icon-closed': !tocOpen }" />
      </button>

      <!-- 主内容区：资讯列表 -->
      <div class="news-main">
        <!-- 移动端（≤860px）：顶部横向滚动的日期胶囊，点击同样平滑定位 -->
        <nav class="news-toc-mobile" aria-label="资讯日期目录">
          <a v-for="g in newsGroups" :key="'m' + g.date" class="news-toc-mobile-item" href="#"
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

// 点击目录项，平滑滚动到对应日期分组
function scrollToDate(date) {
  const el = document.getElementById('news-' + date)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 目录元素引用
const tocEl = ref(null)

// 桌面端左侧目录是否展开（横向展开/收起状态）
const tocOpen = ref(false)

// 目录上滚动：始终阻止默认行为（避免穿透滚动资讯/页面），手动滚动年月日列表本身
function onTocWheel(e) {
  const el = tocEl.value
  if (!el) return
  // 列表是唯一可滚动区域，标题固定不动
  const list = el.querySelector('.news-toc-list')
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
       透明背景可透出水印；标题固定不动，仅年月日列表可滚动（隐藏滚动条） ===== */
.news-toc {
  position: fixed;
  left: 20px;
  top: 60px;
  /* 高于资讯水印，保持可点击 */
  z-index: 2;
  flex-shrink: 0;
  width: 130px;
  /* 最大高度 = 视口高度 - 顶部偏移 - 底部留白（--toc-bottom-offset 可调） */
  max-height: calc(100vh - 118px - var(--toc-bottom-offset));
  /* 纵向布局：标题固定，列表占剩余空间并可滚动 */
  display: flex;
  flex-direction: column;
  /* 透明背景，可透出下层资讯水印 */
  background: transparent;
  border: none;
  padding: 16px 14px;
  /* 横向展开/收起时平滑滑动 */
  transition: transform 0.3s ease;
}

/* 收起状态：整体向左滑出屏幕（宽度 130px + 距左 20px） */
.news-toc-closed {
  transform: translateX(calc(-100% - 20px));
}

/* 目录展开/收起切换按钮：fixed 固定在左侧，展开时位于目录右侧，收起时位于屏幕左边缘 */
.news-toc-toggle {
  position: fixed;
  left: 152px;
  top: 76px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  opacity: 0.85;
  padding: 0;
  /* left 与图标旋转同步过渡 */
  transition: left 0.3s ease, transform 0.3s ease, background var(--transition), color var(--transition), opacity var(--transition);
}

.news-toc-toggle:hover {
  opacity: 1;
  background: var(--bg-secondary);
}

.news-toc-toggle-closed {
  left: 20px;
}

.news-toc-toggle-icon {
  transition: transform 0.3s ease;
}

/* 收起时箭头旋转 180° 指向右侧（提示可展开） */
.news-toc-toggle-icon-closed {
  transform: rotate(180deg);
}

.news-toc-title {
  /* 标题固定，不随列表滚动 */
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--title);
  margin-bottom: 10px;
  padding: 0 6px;
}

.news-toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  /* 仅年月日列表可滚动，标题保持固定 */
  overflow-y: auto;
  min-height: 0;
  /* 不显示滚动条（Firefox） */
  scrollbar-width: none;
}

.news-toc-list::-webkit-scrollbar {
  display: none;
}

.news-toc-link {
  display: block;
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text);
  opacity: 0.82;
  transition: background var(--transition), color var(--transition), opacity var(--transition);
}

.news-toc-link:hover {
  opacity: 1;
  background: var(--bg-secondary);
}

/* ===== 移动端顶部横向目录（默认隐藏，仅窄屏显示） ===== */
.news-toc-mobile {
  display: none;
}

/* 窄屏：隐藏左侧固定目录及其展开按钮，改为顶部横向滚动目录 */
@media (max-width: 860px) {
  .news-toc {
    display: none;
  }

  .news-toc-toggle {
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

  .news-toc-mobile-item {
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

  .news-toc-mobile-item:hover {
    opacity: 1;
    background: var(--bg-secondary);
  }
}

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
