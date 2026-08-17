<template>
  <!-- 工具页主容器：左侧固定目录（大类+子类）+ 右侧工具分区（移动端改为顶部大类目录） -->
  <section class="page-section">
    <div class="container tools-layout">
      <!-- 桌面端（>860px）：固定在屏幕左侧的分类目录，大类下展示子类（工具项），点击平滑定位 -->
      <aside ref="tocEl" class="tools-toc" :class="{ 'tools-toc-closed': !tocOpen }" :style="tocStyle"
        aria-label="工具分类目录">
        <h4 class="tools-toc-title">目录</h4>
        <ul class="tools-toc-list">
          <li v-for="c in toolCategories" :key="c.key">
            <a class="tools-toc-cat" href="#" @click.prevent="scrollTo('tools-section-' + c.key)">
              <span class="tools-toc-dot" :style="{ background: c.color }"></span>
              {{ c.title }}
            </a>
            <ul class="tools-toc-sub">
              <li v-for="t in c.tools" :key="t.key">
                <a class="tools-toc-link" href="#" @click.prevent="scrollTo('tool-' + t.key)">{{ t.shortName || t.name
                }}</a>
              </li>
            </ul>
          </li>
        </ul>
      </aside>

      <!-- 目录拖拽条（桌面端）：位于目录右侧垂直居中，点击切换开合，长按水平拖拽可伸缩目录（松手吸附） -->
      <div class="tools-toc-handle" :style="handleStyle" role="button" tabindex="0"
        :aria-expanded="tocOpen" aria-label="展开或收起目录" @pointerdown="onHandlePointerDown"
        @keydown.enter.prevent="tocOpen = !tocOpen" @keydown.space.prevent="tocOpen = !tocOpen">
        <AppIcon name="chevron-left" :size="10" class="tools-toc-handle-icon"
          :class="{ 'tools-toc-handle-icon-closed': !tocOpen }" />
      </div>

      <!-- 主内容区：各分类分区 -->
      <div class="tools-main">
        <!-- 移动端（≤860px）：顶部横向滚动的大类胶囊，点击同样平滑定位 -->
        <nav class="tools-toc-mobile" aria-label="工具分类目录">
          <a v-for="c in toolCategories" :key="'m' + c.key" class="tools-toc-mobile-item" href="#"
            @click.prevent="scrollTo('tools-section-' + c.key)">
            <span class="tools-toc-dot" :style="{ background: c.color }"></span>{{ c.title }}
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
  const list = el.querySelector('.tools-toc-list')
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

/* ===== 桌面端左侧目录：fixed 固定在屏幕左侧（距左 20px、距顶 60px），
       标题固定不动，仅目录列表可滚动（隐藏滚动条） ===== */
.tools-toc {
  position: fixed;
  left: 20px;
  top: 60px;
  z-index: 2;
  flex-shrink: 0;
  /* 与资讯页目录宽度保持一致 */
  width: 130px;
  /* 最大高度 = 视口高度 - 顶部偏移 - 底部留白 */
  max-height: calc(100vh - 118px);
  /* 纵向布局：标题固定，列表占剩余空间并可滚动 */
  display: flex;
  flex-direction: column;
  background: transparent;
  border: none;
  padding: 16px 14px;
  /* 横向展开/收起时平滑滑动 */
  transition: transform 0.3s ease;
}

/* 收起状态：整体向左滑出屏幕（宽度 130px + 距左 20px） */
.tools-toc-closed {
  transform: translateX(calc(-100% - 20px));
}

/* 目录拖拽条：fixed 固定在目录右侧垂直居中位置，展开时贴目录右边缘，收起时位于屏幕左边缘。
   水平位置（left）由 JS 内联控制，拖拽时关闭过渡跟手，非拖拽时平滑过渡 */
.tools-toc-handle {
  position: fixed;
  z-index: 3;
  /* 垂直居中：目录区域 top 60px、最大高度 calc(100vh - 118px) */
  top: calc(60px + (100vh - 118px) / 2);
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  height: 64px;
  border-radius: 5px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-sm);
  cursor: ew-resize;
  /* 允许水平拖拽不被页面滚动抢占 */
  touch-action: none;
  user-select: none;
  opacity: 0.85;
  padding: 0;
  transition: left 0.3s ease, background var(--transition), color var(--transition), opacity var(--transition);
}

.tools-toc-handle:hover {
  opacity: 1;
  background: var(--bg-secondary);
}

.tools-toc-handle:active {
  opacity: 1;
  background: var(--bg-secondary);
}

.tools-toc-handle-icon {
  transition: transform 0.3s ease;
}

/* 收起时箭头旋转 180° 指向右侧（提示可展开） */
.tools-toc-handle-icon-closed {
  transform: rotate(180deg);
}

.tools-toc-title {
  /* 标题固定，不随列表滚动 */
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--title);
  margin-bottom: 10px;
  padding: 0 6px;
}

.tools-toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  /* 仅目录列表可滚动，标题保持固定 */
  overflow-y: auto;
  min-height: 0;
  /* 不显示滚动条 */
  scrollbar-width: none;
}

.tools-toc-list::-webkit-scrollbar {
  display: none;
}

/* 大类：带分类颜色圆点 */
.tools-toc-cat {
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

.tools-toc-cat:hover {
  background: var(--bg-secondary);
}

.tools-toc-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* 子类（工具项）：与大类对齐，不缩进，字号略小 */
.tools-toc-sub {
  list-style: none;
  margin: 0 0 6px;
  padding: 0;
}

.tools-toc-link {
  display: block;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--text);
  opacity: 0.78;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background var(--transition), color var(--transition), opacity var(--transition);
}

.tools-toc-link:hover {
  opacity: 1;
  background: var(--bg-secondary);
}

/* ===== 移动端顶部横向目录（默认隐藏，仅窄屏显示） ===== */
.tools-toc-mobile {
  display: none;
}

/* 窄屏：隐藏左侧固定目录及其展开按钮，改为顶部横向滚动的大类目录 */
@media (max-width: 860px) {
  .tools-toc {
    display: none;
  }

  .tools-toc-handle {
    display: none;
  }

  .tools-toc-mobile {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 18px;
    padding-bottom: 6px;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .tools-toc-mobile::-webkit-scrollbar {
    display: none;
  }

  .tools-toc-mobile-item {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
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

  .tools-toc-mobile-item:hover {
    opacity: 1;
    background: var(--bg-secondary);
  }
}
</style>
