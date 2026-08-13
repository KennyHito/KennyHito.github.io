<script setup>
import { inject } from 'vue'
import { site, repos } from '../data/site.js'

const navigate = inject('navigate')

// 解构仓库列表为具名引用（顺序与 site.js 中 repos 数组一一对应）
const [repoIOS, repoWebBasic, repoVueBasic, repoVueTest, repoVue3Test, repoHelloVue3] = repos

</script>

<template>
  <section class="page-section">
    <h2 class="intro-title">Hi，大家好！</h2>
    <div class="container prose">
      <div class="card">
        <div class="intro-list">
          <p>☕️ I'm KennyHito.</p>
          <p>🦌 本人历经初创公司、互联网公司，目前在金融公司！</p>
          <p>🌟 搭建的个人网站，<a class="inline-link" :href="site.devnote" target="_blank" rel="noopener">点击前往网站</a>。
          </p>
          <p>
            🍇 本人<a class="inline-link" :href="site.vpn" target="_blank" rel="noopener">自用梯子🪜</a>，可先注册试用 24
            小时，个人觉得还是很稳定！（可能网页会提示不安全，不用管，直接继续访问即可。）
          </p>
          <p>🤔 主攻 iOS 和 Vue！</p>
          <p>
            📱 iOS 在工作中主要采用 Objective-C 开发语言，日常写了一些功能（封装），若你有需要可自行查看，<a class="inline-link" :href="repoIOS.url"
              target="_blank" rel="noopener">{{ repoIOS.name }}</a>。
          </p>
          <div>
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
            <p>🍋 若以上某个项目对你有所帮助，希望可以在 <a class="inline-link" :href="site.github" target="_blank"
                rel="noopener">GitHub</a> 上点个 Star 和 Fork 🤗！</p>
          </div>
          <p>📮 如有问题请反馈邮箱 <a class="inline-link" :href="'mailto:' + site.email">{{ site.email }}</a>。</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ===== 通用文本块（About 页面） ===== */
.prose h3 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
}

.prose p {
  font-size: 16px;
  opacity: 0.85;
  margin-bottom: 14px;
}

.prose .card {
  margin-bottom: 24px;
}

/* ===== 个人简介标题 ===== */
.intro-title {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-align: center;
  margin: 0 0 20px;
}

/* ===== 个人简介列表 ===== */
.intro-list {
  margin: 0;
  padding: 0;
}

/* 主列表条目（段落 / 内联块） */
.intro-list>p,
.intro-list>div {
  position: relative;
  padding-left: 6px;
  margin: 0 0 14px;
  font-size: 16px;
  /* 行高引用可配置变量 */
  line-height: var(--about-line-height);
  color: var(--text);
}

/* 子列表（如 Vue 教程链接区）容器 */
.intro-sublist {
  margin: 10px 0 4px;
  padding: 4px 20px;
  /* 主题自适应背景，避免暗色下白底看不清 */
  background: var(--surface);
  border-radius: var(--radius-sm);
}

/* 子列表条目 */
.intro-sublist>p,
.intro-sublist>div {
  position: relative;
  margin: 0 0 10px;
  font-size: 15px;
  /* 与主列表共用同一行高变量 */
  line-height: var(--about-line-height);
  color: var(--text);
}

/* ===== 行内链接（如 GitHub 仓库、梯子链接） ===== */
.inline-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
  /* 默认无下划线，悬停时出现 */
  border-bottom: 1px solid transparent;
  transition: border-color var(--transition);
}

.inline-link:hover {
  border-bottom-color: var(--accent);
}
</style>
