<!-- ===== 资讯分组面板 NewsPanel：按日期折叠 / 展开资讯列表 ===== -->
<template>
  <div class="news-group" :class="{ open }">
    <button class="news-date" @click="toggle" :aria-expanded="open">
      <span>{{ group.date }}</span>
      <span class="arrow">▾</span>
    </button>
    <div class="news-items" :hidden="!open">
      <div class="news-item" v-for="(item, i) in group.items" :key="i">
        <h4>{{ item.title }}</h4>
        <p class="summary">{{ item.summary }}</p>
        <div class="news-tags">
          <span v-for="(tag, j) in item.tags" :key="j">{{ tag }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 接收单个日期分组的资讯数据（含 expanded 控制默认展开状态）
const props = defineProps({
  group: { type: Object, required: true }
})

// 最新日期默认展开，历史日期默认折叠（来自数据里的 expanded 字段）
const open = ref(props.group.expanded)

// 切换该分组的展开 / 收起状态
function toggle() {
  open.value = !open.value
}
</script>

<style scoped>
/* ===== 资讯折叠（News 页面） ===== */
.news-group {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  margin-bottom: 16px;
  /* 圆角裁剪内部内容 */
  overflow: hidden;
}

/* 日期折叠标题按钮 */
.news-date {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 18px 24px;
  font-size: 17px;
  font-weight: 600;
  color: var(--title);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 折叠箭头 */
.news-date .arrow {
  transition: transform var(--transition);
  opacity: 0.6;
}

/* 展开时箭头旋转 180° */
.news-group.open .news-date .arrow {
  transform: rotate(180deg);
}

/* 折叠内容区 */
.news-items {
  padding: 0 24px 20px;
}

/* 隐藏状态：完全不渲染 */
.news-items[hidden] {
  display: none;
}

/* 单条资讯 */
.news-item {
  padding: 16px 0;
  border-top: 1px solid var(--border);
}

.news-item h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
}

.news-item .summary {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 10px;
}

/* 资讯标签容器 */
.news-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.news-tags span {
  font-size: 12px;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: var(--radius-pill);
  padding: 4px 10px;
}
</style>
