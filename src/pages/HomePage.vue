<script setup>
import { inject } from 'vue'
import { features, intro } from '../data/home.js'

const navigate = inject('navigate')
</script>

<template>
  <section class="page-section">
    <div class="container">
      <div class="section-head">
        <h2>知识分享站</h2>
        <p>沉淀实用干货的开放知识分享平台</p>
      </div>
      <div class="intro-card">
        <p class="intro-text" v-for="(p, i) in intro" :key="i">{{ p }}</p>
      </div>
    </div>
  </section>

  <section class="page-section bg-alt">
    <div class="container">
      <div class="section-head">
        <h2>网站直达</h2>
        <p>从工具到资讯，一站式满足你的学习路径</p>
      </div>
      <div class="feature-grid">
        <div class="card" v-for="f in features" :key="f.title" @click="navigate(f.target)" style="cursor:pointer">
          <div class="ico">{{ f.icon }}</div>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bg-alt {
  background: var(--bg-secondary);
}

.intro-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 28px;
  box-shadow: var(--shadow-sm);
}

.intro-text {
  font-size: 16px;
  line-height: 1.95;
  color: var(--text);
  opacity: 0.82;
  margin: 0 0 18px;
}

.intro-text:last-child {
  margin-bottom: 0;
}

@media (max-width: 734px) {
  .intro-card {
    padding: 22px;
  }

  .intro-text {
    font-size: 15px;
    line-height: 1.85;
  }
}
</style>
