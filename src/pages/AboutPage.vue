<!-- ===== 关于页 AboutPage：左侧固定信息栏（头像 / 简介 / 标签）+ 右侧关于我 / 关于本站内容 ===== -->
<template>
  <section class="page-section about page-root">
    <div class="container about-grid">
      <!-- 左侧信息栏 -->
      <aside class="about-aside">
        <div class="avatar">
          <img src="../img/about.jpg" alt="KennyHito" />
        </div>
        <h1 class="about-name">KennyHito</h1>
        <p class="about-role">iOS &amp; Vue 开发者</p>
        <p class="about-meta">中国 · 北京</p>
        <p class="about-quote">Look for and don't give up, give up, don't look back!</p>
        <div class="about-social">
          <a class="social-btn" :href="site.github" target="_blank" rel="noopener" aria-label="GitHub">
            <AppIcon name="github" :size="22" />
          </a>
          <a class="social-btn" :href="`mailto:${site.email}`" aria-label="发送邮件">
            <AppIcon name="mail" :size="20" />
          </a>
        </div>
        <ul class="about-tags">
          <li>iOS</li>
          <li>Vue</li>
          <li>工具</li>
          <li>开源</li>
        </ul>
      </aside>

      <!-- 右侧内容流 -->
      <div class="about-main">
        <section class="about-block">
          <h2 class="block-title">关于我</h2>
          <div class="prose">
            <p>☕️ I'm KennyHito。</p>
            <p>🌟 搭建的个人网站 <a class="inline-link" :href="site.devnote" target="_blank" rel="noopener">点击前往</a>。</p>
            <p>🍇 自用 <a class="inline-link" :href="site.vpn" target="_blank" rel="noopener">梯子🪜</a>（可注册试用 24
              小时，访问提示不安全请忽略继续）。</p>
            <p>🤔 主攻 iOS 和 Vue。</p>
            <p>📱 iOS 工作主要用 Objective-C，日常封装了一些功能，见 <a class="inline-link" :href="repoIOS.url" target="_blank"
                rel="noopener">{{ repoIOS.name }}</a>。</p>
            <p>💻 Vue 是学习尚硅谷 B站教学视频，感兴趣的可以看看禹神讲解。</p>
            <div class="intro-sublist">
              <p>①、尚硅谷前端入门 html+css 零基础教程，零基础前端开发 html5+css3 视频 <a class="inline-link" :href="repoWebBasic.url"
                  target="_blank" rel="noopener">{{ repoWebBasic.name }}</a>。</p>
              <p>②、尚硅谷 Vue2.0+Vue3.0 全套教程丨vuejs 从入门到精通 <a class="inline-link" :href="repoVueBasic.url" target="_blank"
                  rel="noopener">{{ repoVueBasic.name }}</a>、<a class="inline-link" :href="repoVueTest.url"
                  target="_blank" rel="noopener">{{ repoVueTest.name }}</a>和<a class="inline-link"
                  :href="repoVue3Test.url" target="_blank" rel="noopener">{{ repoVue3Test.name }}</a>。</p>
              <p>③、尚硅谷 Vue3 入门到实战，最新版 vue3+TypeScript 前端开发教程 <a class="inline-link" :href="repoHelloVue3.url"
                  target="_blank" rel="noopener">{{ repoHelloVue3.name }}</a>。</p>
            </div>
            <p>🍋 若以上内容对你有帮助，欢迎到 <a class="inline-link" :href="site.github" target="_blank" rel="noopener">GitHub</a> 点个
              Star 和 Fork 🤗！</p>
          </div>
        </section>

        <section class="about-block">
          <h2 class="block-title">关于本站</h2>
          <div class="prose">
            <p class="site-text" v-for="(p, i) in intro" :key="i">{{ p }}</p>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup>
// 引入 Vue 依赖注入，获取全局路由跳转方法
import { inject } from 'vue'
// 站点配置（GitHub / 邮箱 / 外链等）与仓库列表 repos
import { site, repos } from '../data/site.js'
// 首页数据中的「关于本站」介绍段落（intro 数组）
import { intro } from '../data/home.js'
// 通用图标组件（GitHub / 邮件图标）
import AppIcon from '../components/AppIcon.vue'

// 从根组件注入的 navigate 方法
const navigate = inject('navigate')

// 将 repos 数组按固定顺序解构为具名引用，对应下方「关于我」中的尚硅谷系列仓库链接
const [repoIOS, repoWebBasic, repoVueBasic, repoVueTest, repoVue3Test, repoHelloVue3] = repos
</script>

<style scoped>
/* ===== 关于页：两栏布局（侧栏 + 内容） ===== */
.about {
  /* 顶部导航栏占位由全局 .page-root 统一提供（桌面 120px / 移动端 90px）；
     此处仅保留较大的底部留白 */
  padding-bottom: 64px;
}

.about-grid {
  display: grid;
  grid-template-columns: 268px 1fr;
  gap: 52px;
  align-items: start;
}

/* 左侧信息栏：随页面整体滚动（不吸顶固定） */
.about-aside {
  text-align: center;
}

.avatar {
  width: 104px;
  height: 104px;
  margin: 0 auto 18px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.about-name {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 6px;
}

.about-role {
  font-size: 15px;
  font-weight: 600;
  color: var(--accent);
  margin: 0 0 4px;
}

.about-meta {
  font-size: 13.5px;
  opacity: 0.7;
  margin: 0 0 16px;
}

/* 个人名言警句：常规正体、低对比点缀，置于「中国 · 北京」下方 */
.about-quote {
  font-size: 13px;
  line-height: 1.6;
  opacity: 0.6;
  margin: 0 0 16px;
  padding: 0 8px;
}

.about-social {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
}

.social-btn {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--title);
  transition: transform var(--transition), border-color var(--transition), color var(--transition), box-shadow var(--transition);
}

.social-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.about-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  list-style: none;
  padding: 0;
  margin: 0;
}

.about-tags li {
  font-size: 12.5px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
}

/* ===== 右侧内容 ===== */
.about-block {
  margin-bottom: 44px;
}

.about-block:last-child {
  margin-bottom: 0;
}

.block-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 16px;
  padding-left: 13px;
  border-left: 3px solid var(--accent);
  line-height: 1.2;
}

.prose p {
  font-size: 16px;
  line-height: 1.85;
  color: var(--text);
  opacity: 0.88;
  margin: 0 0 14px;
}

.prose p:last-child {
  margin-bottom: 0;
}

/* 子列表（尚硅谷系列清单）：轻微内缩 + 主题自适应底边 */
.intro-sublist {
  margin: 10px 0 4px;
  padding: 4px 20px;
  border-radius: var(--radius-sm);
}

.intro-sublist>p {
  position: relative;
  margin: 0 0 10px;
  font-size: 15px;
  line-height: var(--about-line-height);
  color: var(--text);
}

.site-text {
  font-size: 15.5px;
  line-height: 1.9;
  text-indent: 2em;
}

/* 行内链接 */
.inline-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
  border-bottom: 1px solid transparent;
  transition: border-color var(--transition);
}

.inline-link:hover {
  border-bottom-color: var(--accent);
}

/* ===== 移动端：单列堆叠；导航栏略矮，顶部留白收窄 ===== */
@media (max-width: 734px) {
  .about-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}
</style>
