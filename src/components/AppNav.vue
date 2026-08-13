<script setup>
import { ref, watch } from 'vue'
import ThemeToggle from './ThemeToggle.vue'

defineProps({
  tabs: { type: Array, required: true },
  current: { type: String, required: true }
})
const emit = defineEmits(['switch'])

// 移动端汉堡菜单展开/收起
const mobileMenuOpen = ref(false)

function switchTab(key) {
  mobileMenuOpen.value = false
  emit('switch', key)
}

// 菜单展开时锁定 body 滚动，关闭时恢复
watch(mobileMenuOpen, (open) => {
  if (open) {
    document.body.classList.add('body--no-scroll')
  } else {
    document.body.classList.remove('body--no-scroll')
  }
})

/**
 * 阻止 body 滚动穿透（iOS Safari 橡皮筋效果）。
 * 仅当菜单展开且触碰点不在菜单内部时阻止默认滚动行为，
 * 菜单内部本身仍可滚动（未来扩展）。
 */
function onTouchMove(e) {
  if (!mobileMenuOpen.value) return
  const menu = document.getElementById('nav-mobile-menu')
  if (menu && !menu.contains(e.target)) {
    e.preventDefault()
  }
}

document.addEventListener('touchmove', onTouchMove, { passive: false })
// 组件卸载时移除监听（本应用导航常驻，保留清理逻辑）
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    document.removeEventListener('touchmove', onTouchMove)
  })
}
</script>

<template>
  <nav class="nav">
    <div class="nav-left">
      <button class="nav-logo" @click="switchTab('home')" aria-label="返回首页" title="返回首页">
        <img src="/main_icon.png" alt="知识分享站" width="32" height="32" />
      </button>
    </div>
    <div class="nav-actions">
      <!-- 桌面端：直接显示 Tab 列表、分隔线、主题开关、GitHub -->
      <nav class="nav-tabs" aria-label="主导航">
        <a v-for="t in tabs" :key="t.key" class="tab" :class="{ active: t.key === current }"
          @click.prevent="switchTab(t.key)">{{ t.label }}</a>
      </nav>
      <span class="nav-divider" aria-hidden="true"></span>
      <ThemeToggle />
      <a class="nav-github" href="https://github.com/KennyHito" target="_blank" rel="noopener"
        aria-label="前往 GitHub">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.41 7.86 10.94.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.69-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.07 0 0 .96-.31 3.15 1.18a10.98 10.98 0 0 1 5.76 0c2.18-1.49 3.14-1.18 3.14-1.18.63 1.6.24 2.78.12 3.07.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.24 5.69.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56C20.72 21.4 24 17.08 24 12c0-6.35-5.15-11.5-11.5-11.5z" />
        </svg>
      </a>

      <!-- 移动端：汉堡菜单按钮（展开/收起） -->
      <button class="nav-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen"
        :aria-label="mobileMenuOpen ? '关闭导航菜单' : '打开导航菜单'" :aria-expanded="mobileMenuOpen"
        aria-controls="nav-mobile-menu">
        <svg v-if="!mobileMenuOpen" class="nav-menu-icon" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
        <svg v-else class="nav-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="6" y1="18" x2="18" y2="6" />
        </svg>
      </button>
    </div>
  </nav>

  <!-- 移动端下拉菜单：仅包含 Tab 列表，主题开关和 GitHub 保留在导航栏内 -->
  <div id="nav-mobile-menu" class="nav-mobile-menu" :class="{ 'is-open': mobileMenuOpen }"
    aria-hidden="!mobileMenuOpen">
    <nav class="nav-mobile-menu__tabs" aria-label="移动导航">
      <a v-for="t in tabs" :key="t.key" class="mobile-tab" :class="{ active: t.key === current }"
        @click.prevent="switchTab(t.key)">{{ t.label }}</a>
    </nav>
  </div>
</template>

<style scoped>
/* ===== 导航 ===== */
.nav {
  /* 吸顶：滚动时固定在顶部 */
  position: sticky;
  top: 0;
  /* 层级高于内容，避免被遮挡 */
  z-index: 100;
  /* Flex：Logo 固定靠左，其余内容（Tab → 竖线 → 开关 → GitHub）靠右 */
  display: flex;
  align-items: center;
  gap: 14px;
  height: 52px;
  padding: 0 22px;
  /* 半透明背景，配合毛玻璃 */
  background: rgba(255, 255, 255, 0.72);
  /* 背景模糊（标准） */
  backdrop-filter: saturate(180%) blur(20px);
  /* 背景模糊（Safari 前缀） */
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  /* 底部细分割线 */
  border-bottom: 1px solid var(--border);
  transition: background var(--transition), border-color var(--transition);
}

/* 暗色下导航栏半透明背景 */
[data-theme="dark"] .nav {
  background: rgba(18, 18, 18, 0.72);
}

/* 导航左侧分组：Logo，auto 外边距将后续内容推向右侧 */
.nav-left {
  display: flex;
  align-items: center;
  margin-right: auto;
}

/* 站点 Logo 按钮 */
.nav-logo {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition), transform 0.1s ease;
}

/* Logo 悬停底色 */
.nav-logo:hover {
  background: var(--bg-secondary);
}

/* Logo 按下轻微缩小，提供点击反馈 */
.nav-logo:active {
  transform: scale(0.94);
}

/* 导航右侧操作区（Tab → 竖线 → 主题开关 → GitHub → 汉堡按钮） */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Tab 列表容器：居中排列 */
.nav-tabs {
  display: flex;
  gap: 4px;
  align-items: center;
}

/* Tab 与主题开关之间的竖线分隔符 */
.nav-divider {
  flex-shrink: 0;
  width: 1px;
  height: 18px;
  background: var(--border);
  margin: 0 4px;
}

/* 单个 Tab 文字 */
.tab {
  font-size: 15px;
  /* 未激活时略淡 */
  opacity: 0.85;
  /* 紧凑间距 */
  padding: 7px 10px;
  letter-spacing: -0.2px;
  /* 胶囊形状 */
  border-radius: 980px;
  cursor: pointer;
  /* 不换行 */
  white-space: nowrap;
  color: var(--text);
  transition: opacity var(--transition), color var(--transition), background var(--transition);
}

/* Tab 悬停：仅变清晰，不加背景色 */
.tab:hover {
  opacity: 1;
}

/* Tab 激活态：去掉背景色，文字改为与滚动进度环一致的橙色 */
.tab.active {
  opacity: 1;
  color: #ff6b35;
}

/* 导航右侧 GitHub 图标 */
.nav-github {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--title);
  opacity: 0.85;
  transition: opacity var(--transition), background var(--transition);
}

.nav-github:hover {
  opacity: 1;
  background: var(--bg-secondary);
}

.nav-github svg {
  width: 22px;
  height: 22px;
}

/* 桌面端：隐藏移动端汉堡菜单按钮和下拉菜单 */
.nav-menu-btn,
.nav-mobile-menu {
  display: none;
}

/* ===== 移动端（≤734px） ===== */
@media (max-width: 734px) {
  .nav {
    padding: 0 14px;
  }

  /* 移动端：隐藏 Tab 列表和分隔线（主题开关、GitHub 保留在导航栏内） */
  .nav-tabs,
  .nav-divider {
    display: none;
  }

  /* 移动端汉堡菜单按钮：显示在右侧 */
  .nav-menu-btn {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface, transparent);
    color: var(--title);
    cursor: pointer;
    transition: background var(--transition), color var(--transition);
  }

  .nav-menu-btn:hover {
    background: var(--bg-secondary);
  }

  .nav-menu-icon {
    width: 22px;
    height: 22px;
  }

  /* 移动端下拉菜单：默认隐藏，展开后从导航栏下方滑下 */
  .nav-mobile-menu {
    display: none;
    position: absolute;
    top: 52px;
    left: 0;
    right: 0;
    z-index: 99;
    padding: 16px 18px 18px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  [data-theme="dark"] .nav-mobile-menu {
    background: rgba(18, 18, 18, 0.96);
  }

  .nav-mobile-menu.is-open {
    display: block;
    animation: menuSlideDown 0.22s ease both;
  }

  @keyframes menuSlideDown {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .nav-mobile-menu__tabs {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .mobile-tab {
    display: block;
    padding: 12px 14px;
    border-radius: 10px;
    font-size: 16px;
    color: var(--text);
    opacity: 0.9;
    transition: opacity var(--transition), color var(--transition), background var(--transition);
  }

  .mobile-tab.active {
    opacity: 1;
    color: #ff6b35;
  }

  .mobile-tab:hover {
    opacity: 1;
    background: var(--bg-secondary);
  }
}
</style>
