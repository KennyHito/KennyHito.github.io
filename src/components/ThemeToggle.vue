<script setup>
import { useTheme } from '../composables/useTheme.js'
import { iconSun, iconMoon } from '../data/path.js'

const { theme, toggle } = useTheme()
</script>

<template>
  <button
    class="theme-toggle"
    role="switch"
    :aria-checked="theme === 'dark'"
    :aria-label="theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'"
    @click="toggle"
  >
    <span class="theme-toggle-track">
      <span class="theme-toggle-thumb">
        <svg v-if="theme === 'light'" class="theme-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path :d="iconSun" />
        </svg>
        <svg v-else class="theme-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path :d="iconMoon" />
        </svg>
      </span>
    </span>
  </button>
</template>

<style scoped>
/* 主题切换开关（日/夜）：滑动开关样式 */
.theme-toggle {
  flex-shrink: 0;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

/* 轨道：亮色为白色轨道，暗色为黑色轨道 */
.theme-toggle-track {
  display: block;
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #ffffff;
  transition: background var(--transition), border-color var(--transition);
}

[data-theme="dark"] .theme-toggle-track {
  background: #000000;
}

/* 滑块（太阳/月亮图标容器）：亮色主题 = 白色圆圈 + 黑色太阳；暗色主题 = 黑色圆圈 + 白色月亮。
   投影用于区分同色滑块与轨道，形成清晰轮廓 */
.theme-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  color: #000000;
  display: grid;
  place-items: center;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.28);
  transition: transform 0.25s ease, background var(--transition), color var(--transition), box-shadow var(--transition);
}

/* 暗色模式：滑块移到右侧，黑色圆圈 + 白色月亮，投影改为浅色以在黑色轨道上可见 */
[data-theme="dark"] .theme-toggle-thumb {
  background: #000000;
  color: #ffffff;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18), 0 1px 3px rgba(0, 0, 0, 0.6);
  transform: translateX(20px);
}

.theme-toggle-icon {
  width: 11px;
  height: 11px;
}
</style>
