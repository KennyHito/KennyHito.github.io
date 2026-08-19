<!-- ===== 顶部导航组件 AppNav：桌面 Tab + 移动端汉堡菜单 + 主题开关 ===== -->
<template>
  <nav class="nav">
    <div class="nav-left">
      <button class="nav-logo" @click="switchTab('home')" aria-label="返回首页" title="返回首页">
        <img src="../img/main_icon.png" alt="知识分享站" width="32" height="32" />
      </button>
    </div>
    <!-- 桌面端：Tab 列表绝对定位在导航栏水平正中 -->
    <nav class="nav-tabs" aria-label="主导航">
      <a v-for="t in tabs" :key="t.key" class="tab" :class="{ active: t.key === current }"
        @click.prevent="switchTab(t.key)">{{ t.label }}</a>
    </nav>
    <div class="nav-actions">
      <!-- 搜索按钮：唤起全局搜索弹窗，置于主题切换图标之前 -->
      <SearchButton />
      <ThemeToggle />
      <!-- 移动端：汉堡菜单按钮（展开/收起） -->
      <button class="nav-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen"
        :aria-label="mobileMenuOpen ? '关闭导航菜单' : '打开导航菜单'" :aria-expanded="mobileMenuOpen"
        aria-controls="nav-mobile-menu">
        <AppIcon v-if="!mobileMenuOpen" name="menu" :size="16" />
        <AppIcon v-else name="close" :size="16" />
      </button>
    </div>
  </nav>

  <!-- 移动端遮罩层：菜单展开时遮住下方页面内容，点击可关闭菜单 -->
  <div class="nav-overlay" :class="{ 'is-open': mobileMenuOpen }" @click="mobileMenuOpen = false"
    aria-hidden="true"></div>

  <!-- 移动端下拉菜单：Tab 列表 + 底部站点信息，减少空白 -->
  <div id="nav-mobile-menu" class="nav-mobile-menu" :class="{ 'is-open': mobileMenuOpen }"
    aria-hidden="!mobileMenuOpen">
    <div class="nav-mobile-menu-body">
      <nav class="nav-mobile-menu-tabs" aria-label="移动导航">
        <a v-for="t in tabs" :key="t.key" class="mobile-tab" :class="{ active: t.key === current }"
          @click.prevent="switchTab(t.key)">
          <AppIcon :name="mobileIconMap[t.key]" :size="20" class="mobile-tab-icon" />
          <span>{{ t.label }}</span>
        </a>
      </nav>
      <div class="nav-mobile-menu-footer">
        <p class="menu-site-name">{{ site.name }}</p>
        <p class="menu-site-desc">{{ site.slogan }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import ThemeToggle from './ThemeToggle.vue'
import SearchButton from './SearchButton.vue'
import AppIcon from './AppIcon.vue'
import { site } from '../data/site.js'

// 接收父级传入的 tabs 与 current；向父级派发 switch 事件以切换 tab
defineProps({
  tabs: { type: Array, required: true },
  current: { type: String, required: true }
})
const emit = defineEmits(['switch'])

// 移动端汉堡菜单展开/收起
const mobileMenuOpen = ref(false)

// 移动端菜单图标映射
const mobileIconMap = {
  home: 'home',
  tools: 'tools',
  news: 'news',
  about: 'about'
}

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

<style scoped>
/* ===== 导航：顶部悬浮胶囊 ===== */
.nav {
  /* 悬浮：脱离文档流，固定在视口顶部并水平居中 */
  position: fixed;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  /* 居中胶囊宽度：桌面最大 960，移动端与屏幕留边 */
  width: min(960px, calc(100% - 28px));
  /* 层级高于内容与回到顶部按钮 */
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 14px;
  height: 56px;
  padding: 0 14px 0 16px;
  /* 纯白背景 */
  background: #ffffff;
  /* 背景模糊（标准 + Safari 前缀） */
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  /* 胶囊外形：边框 + 圆角 + 阴影 */
  border: 1px solid var(--border);
  border-radius: 999px;
  box-shadow: var(--shadow-md);
  transition: background var(--transition), border-color var(--transition), box-shadow var(--transition);
}

/* 深色模式：导航栏改用深色表面，保持白色/深色协调 */
[data-theme="dark"] .nav {
  background: var(--bg-secondary);
}

/* 导航左侧分组：Logo */
.nav-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
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
  border-radius: var(--radius-sm);
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

/* 导航右侧操作区（搜索 → 主题开关 → 汉堡按钮），推到最右侧 */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

/* Tab 列表容器：绝对定位在导航栏水平正中（不受左右元素宽度影响） */
.nav-tabs {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  gap: 8px;
  align-items: center;
}

/* 单个 Tab 文字 */
.tab {
  position: relative;
  font-size: 17px;
  /* 加粗显示 */
  font-weight: 600;
  /* 未激活时略淡 */
  opacity: 0.85;
  /* 紧凑间距 */
  padding: 7px 10px;
  letter-spacing: -0.2px;
  cursor: pointer;
  /* 不换行 */
  white-space: nowrap;
  color: var(--text);
  transition: opacity var(--transition), color var(--transition);
}

/* Tab 底部渐变下划线（默认隐藏，悬停 / 激活时滑出） */
.tab::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 1px;
  height: 2px;
  border-radius: 2px;
  background: var(--grad-hero);
  transform: scaleX(0);
  transform-origin: center;
  opacity: 0;
  transition: transform var(--transition), opacity var(--transition);
}

/* Tab 悬停：仅变清晰，下划线半显 */
.tab:hover {
  opacity: 1;
}

.tab:hover::after {
  transform: scaleX(0.5);
  opacity: 0.5;
}

/* Tab 激活态：暖色文字 + 渐变下划线（滑动展开） */
.tab.active {
  opacity: 1;
  color: var(--accent-warm);
}

.tab.active::after {
  transform: scaleX(1);
  opacity: 1;
}

/* 桌面端：隐藏移动端汉堡菜单按钮、下拉菜单和遮罩层 */
.nav-menu-btn,
.nav-mobile-menu,
.nav-overlay {
  display: none;
}

/* ===== 移动端（≤734px） ===== */
@media (max-width: 734px) {
  .nav {
    /* 移动端胶囊更贴边，保持悬浮间距 */
    top: 12px;
    width: calc(100% - 22px);
    padding: 0 12px;
  }

  /* 移动端：隐藏 Tab 列表（已收进汉堡展开菜单） */
  .nav-tabs {
    display: none;
  }

  /* 移动端汉堡菜单按钮：显示在右侧 */
  .nav-menu-btn {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: transparent;
    color: var(--title);
    cursor: pointer;
    transition: color var(--transition);
    /* 禁用触屏高亮/选中背景 */
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }

  /* 触屏下点击/长按/聚焦均不显示背景色 */
  .nav-menu-btn:hover,
  .nav-menu-btn:active,
  .nav-menu-btn:focus,
  .nav-menu-btn:focus-visible {
    background: transparent;
    outline: none;
  }

  /* 移动端下拉菜单：默认隐藏，展开后从导航栏下方滑下 */
  /* 用 fixed 固定在视口：导航栏是 sticky 吸顶的，若用 absolute 定位在文档流，
     页面滚动时菜单会跟随文档滚走，与吸顶的导航栏分离而不可见 */
  .nav-mobile-menu {
    display: none;
    position: fixed;
    top: 74px;
    left: 0;
    right: 0;
    /* 高度自适应内容，默认全部显示无需滚动 */
    z-index: 99;
    padding: 16px 18px 18px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    /* 最底部两个角圆角 */
    border-bottom-left-radius: var(--radius-md);
    border-bottom-right-radius: var(--radius-md);
  }

  [data-theme="dark"] .nav-mobile-menu {
    background: rgba(18, 18, 18, 0.96);
  }

  .nav-mobile-menu.is-open {
    display: block;
    animation: menuSlideDown 0.22s ease both;
  }

  /* 移动端遮罩层：菜单下方覆盖整个剩余视口，遮住页面内容 */
  .nav-overlay {
    display: none;
    position: fixed;
    top: 74px;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 98;
    background: rgba(0, 0, 0, 0.45);
  }

  .nav-overlay.is-open {
    display: block;
    animation: overlayFadeIn 0.22s ease both;
  }

  @keyframes overlayFadeIn {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
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

  .nav-mobile-menu-tabs {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .mobile-tab {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    /* 与桌面端 Tab 字号一致 */
    font-size: 17px;
    /* 与桌面端 Tab 加粗一致 */
    font-weight: 600;
    color: var(--text);
    opacity: 0.9;
    transition: opacity var(--transition), color var(--transition), background var(--transition);
  }

  .mobile-tab.active {
    opacity: 1;
    color: var(--accent-warm);
  }

  .mobile-tab:hover {
    opacity: 1;
    background: var(--bg-secondary);
  }

  .mobile-tab-icon {
    color: var(--title);
    opacity: 0.7;
  }

  .mobile-tab.active .mobile-tab-icon {
    color: var(--accent-warm);
    opacity: 1;
  }

  /* 移动端菜单内容容器：Tab 列表与底部信息分区 */
  .nav-mobile-menu-body {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  /* 移动端菜单底部：站点信息 + 社交链接 */
  .nav-mobile-menu-footer {
    padding-top: 18px;
    border-top: 1px solid var(--border);
    text-align: center;
  }

  .menu-site-name {
    font-size: 17px;
    font-weight: 700;
    color: var(--title);
    margin-bottom: 4px;
  }

  .menu-site-desc {
    font-size: 13px;
    color: var(--text);
    opacity: 0.7;
    margin-bottom: 0;
  }
}
</style>
