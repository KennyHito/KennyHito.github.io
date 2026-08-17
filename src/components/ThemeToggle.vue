<!-- ===== 主题切换按钮 ThemeToggle：亮 / 暗模式切换 ===== -->
<template>
  <button
    class="theme-toggle"
    role="switch"
    :aria-checked="theme === 'dark'"
    :aria-label="theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'"
    @click="toggle"
  >
    <AppIcon :name="theme === 'light' ? 'sun' : 'moon'" :size="18" :stroke-width="2" />
  </button>
</template>

<script setup>
import { useTheme } from '../composables/useTheme.js'
import AppIcon from './AppIcon.vue'

// 从全局主题 composable 解构出当前主题与切换方法
const { theme, toggle } = useTheme()
</script>

<style scoped>
/* 主题切换：图标按钮，贴合胶囊导航（与 Logo 按钮同规格） */
.theme-toggle {
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

.theme-toggle:hover {
  opacity: 1;
  background: var(--bg-secondary);
}

.theme-toggle:active {
  transform: scale(0.94);
}
</style>
