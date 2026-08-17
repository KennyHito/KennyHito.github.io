<!-- ===== 工具页 ToolsPage：左侧目录 + 右侧工具分区 ===== -->

<template>
  <!-- 工具页主容器：左侧固定目录（大类+子类）+ 右侧工具分区（移动端改为顶部大类目录） -->
  <section class="page-section page-root">
    <div class="container tools-layout">
      <!-- 桌面端（>860px）：固定在屏幕左侧的分类目录，大类下展示子类（工具项），点击平滑定位 -->
      <aside ref="tocEl" class="toc" :class="{ 'toc-closed': !tocOpen }" :style="tocStyle"
        aria-label="工具分类目录">
        <h4 class="toc-title">目录</h4>
        <ul class="toc-list">
          <li v-for="c in toolCategories" :key="c.key">
            <a class="toc-cat" href="#" @click.prevent="scrollTo('tools-section-' + c.key)">
              <span class="toc-dot" :style="{ background: c.color }"></span>
              {{ c.title }}
            </a>
            <ul class="toc-sub">
              <li v-for="t in c.tools" :key="t.key">
                <a class="toc-link" href="#" @click.prevent="scrollTo('tool-' + t.key)">{{ t.shortName || t.name
                  }}</a>
              </li>
            </ul>
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

      <!-- 主内容区：各分类分区 -->
      <div class="tools-main">
        <!-- 移动端（≤860px）：顶部横向滚动的大类胶囊，点击同样平滑定位 -->
        <nav class="toc-mobile" aria-label="工具分类目录">
          <a v-for="c in toolCategories" :key="'m' + c.key" class="toc-mobile-item" href="#"
            @click.prevent="scrollTo('tools-section-' + c.key)">
            <span class="toc-dot" :style="{ background: c.color }"></span>{{ c.title }}
          </a>
        </nav>

        <!-- 每个分类一个独立分区，内部各自使用 useMasonry 瀑布流 -->
        <ToolsSection v-for="c in toolCategories" :key="c.key" :category="c" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { toolCategories } from '../data/tools.js'
import ToolsSection from '../components/ToolsSection.vue'
import AppIcon from '../components/AppIcon.vue'
import { useTocDrag } from '../composables/useTocDrag.js'

// 引入 Vue API、工具数据源、目录拖拽组合式函数与页面组件
// 点击目录项，平滑滚动到对应分区 / 工具卡片
function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 目录展开/收起：点击切换，长按拖拽伸缩（拖拽条固定在目录右侧垂直居中）
const { tocOpen, tocStyle, handleStyle, onHandlePointerDown } = useTocDrag()

// 目录元素引用
const tocEl = ref(null)

// 目录上滚动：始终阻止默认行为（避免穿透滚动资讯/页面），手动滚动目录列表本身
function onTocWheel(e) {
  const el = tocEl.value
  if (!el) return
  const list = el.querySelector('.toc-list')
  if (!list) return
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

/* ===== 左右布局：左侧固定目录 + 右侧工具主内容 ===== */
.tools-layout {
  display: flex;
  align-items: flex-start;
  gap: 28px;
}

/* 主内容区（各分类分区）：占满目录之外的剩余宽度 */
.tools-main {
  flex: 1;
  min-width: 0;
}

/* ===== 工具页专属：大类（带分类颜色圆点）目录条目样式 =====
   目录容器、拖拽条、列表、链接、移动端胶囊等共享样式已统一移至 style.css（.toc*） */

/* 大类：带分类颜色圆点 */
.toc-cat {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--title);
  transition: background var(--transition), color var(--transition), opacity var(--transition);
}

.toc-cat:hover {
  background: var(--bg-secondary);
}

.toc-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* 子类（工具项）：与大类对齐，不缩进，字号略小 */
.toc-sub {
  list-style: none;
  margin: 0 0 6px;
  padding: 0;
}
</style>
