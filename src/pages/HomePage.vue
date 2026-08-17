<!-- ===== 首页 HomePage：顶部 Hero 渐变标题区 + 编辑式三栏内容主线（工具 / 资讯 / 笔记跳转） ===== -->
<template>
  <!-- Hero：渐变标题区 -->
  <section class="page-section hero page-root">
    <div class="container hero-inner">
      <h1 class="hero-title">把技术<span class="grad-text">拆开</span>，让学习<span class="grad-text">落地</span></h1>
      <p class="hero-sub">实用开发工具，前沿科技资讯。</p>
    </div>
  </section>

  <!-- 内容主线：编辑式三栏，无卡片边框/底色 -->
  <section class="page-section pillars">
    <div class="container">
      <div class="pillar-row">
        <a class="pillar" v-for="p in pillars" :key="p.index" @click="navigate(p.target)" style="cursor:pointer">
          <span class="pillar-index">{{ p.index }}</span>
          <span class="pillar-ico">{{ p.icon }}</span>
          <h3>{{ p.title }}</h3>
          <p>{{ p.desc }}</p>
          <span class="pillar-go">{{ p.go }} <span class="arrow">→</span></span>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
// 引入 Vue 依赖注入 API，用于获取全局路由跳转方法
import { inject } from 'vue'
// 引入首页三栏内容数据（栏目文案、图标、跳转目标）
import { pillars } from '../data/home.js'

// 从根组件注入的 navigate 方法：点击栏目时跳转到对应页面
const navigate = inject('navigate')
</script>

<style scoped>
/* ===== Hero：渐变标题区 ===== */
.hero {
  position: relative;
  /* 顶部留出悬浮导航栏高度（桌面 ~70px + 余量），内容不遮挡 */
  padding: 120px 0 64px;
  text-align: center;
  overflow: hidden;
  /* 顶部极淡渐变，替代原圆形光晕：干净又有层次 */
  background: linear-gradient(180deg, var(--accent-soft), transparent 72%);
}

.hero-inner {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 52px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin: 0 0 18px;
}

/* 渐变文字（蓝→橙） */
.grad-text {
  background: var(--grad-hero);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.hero-sub {
  font-size: 19px;
  opacity: 0.82;
  max-width: 620px;
  margin: 0 auto 30px;
  line-height: 1.6;
}

/* ===== 内容主线：编辑式三栏 ===== */
.pillar-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
}

.pillar {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  padding: 8px 32px;
  /* 栏目之间用细分隔线，而非卡片边框 */
  border-left: 1px solid var(--border);
  transition: transform var(--transition);
}

.pillar:first-child {
  border-left: none;
  padding-left: 0;
}

.pillar:last-child {
  padding-right: 0;
}

.pillar-index {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
  margin-bottom: 14px;
  background: var(--grad-hero);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.pillar-ico {
  font-size: 26px;
  margin-bottom: 14px;
}

.pillar h3 {
  font-size: 21px;
  font-weight: 600;
  margin: 0 0 12px;
}

.pillar p {
  font-size: 14.5px;
  opacity: 0.8;
  line-height: 1.75;
  margin: 0 0 20px;
}

/* 跳转提示：刻意弱化，避免抢过栏目正文 */
.pillar-go {
  margin-top: auto;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--accent-warm);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pillar-go .arrow {
  transition: transform var(--transition);
}

.pillar:hover {
  transform: translateY(-3px);
}

.pillar:hover .arrow {
  transform: translateX(5px);
}

@media (max-width: 734px) {
  .hero {
    padding: 120px 0 36px;
  }

  .hero-title {
    font-size: 34px;
  }

  .hero-sub {
    font-size: 16px;
  }

  /* 三栏在窄屏下改为单列，分隔线改为顶部细线 */
  .pillar-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .pillar {
    border-left: none;
    border-top: 1px solid var(--border);
    padding: 24px 0;
  }

  .pillar:first-child {
    border-top: none;
    padding-top: 0;
  }

  .pillar:last-child {
    padding-bottom: 0;
  }
}
</style>
