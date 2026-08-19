<!-- ===== 搜索按钮 SearchButton：唤起全局搜索弹窗 ===== -->
<template>
  <button class="nav-search-btn" @click="openSearch" aria-label="搜索工具" title="搜索工具">
    <AppIcon name="search" :size="18" :stroke-width="2" />
  </button>
</template>

<script setup>
// 从根组件注入的打开搜索弹窗方法
import { inject } from 'vue'
import AppIcon from './AppIcon.vue'

const openSearch = inject('openSearch')
</script>

<style scoped>
/* 搜索按钮：图标按钮，规格与 ThemeToggle 一致，置于主题切换图标之前 */
.nav-search-btn {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--title);
  opacity: 0.85;
  cursor: pointer;
  transition: opacity var(--transition), background var(--transition), color var(--transition), transform 0.1s ease;
}

.nav-search-btn:hover {
  opacity: 1;
  background: var(--bg-secondary);
}

.nav-search-btn:active {
  transform: scale(0.94);
}
</style>
