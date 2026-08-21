<!-- ===== 404 页面 NotFound：路由兜底展示，提供回到首页 / 返回上一页 ===== -->
<template>
  <section class="page-section page-root notfound">
    <div class="container notfound-inner">
      <!-- 大字号渐变 404 -->
      <h1 class="notfound-code">404</h1>
      <!-- 主标题 -->
      <h2 class="notfound-title">页面走丢了</h2>
      <!-- 说明文案 -->
      <p class="notfound-desc">
        你访问的页面不存在，或已被移动。<br />
        请检查链接是否正确，或返回首页继续浏览。
      </p>
      <!-- 操作按钮：回到首页（主）+ 返回上一页（次） -->
      <div class="notfound-actions">
        <button class="btn btn-primary" @click="goHome" aria-label="回到首页">回到首页</button>
        <button class="btn btn-secondary" @click="goBack" aria-label="返回上一页">返回上一页</button>
      </div>
    </div>
  </section>
</template>

<script setup>
// 引入 vue-router，用于编程式导航
import { useRouter } from 'vue-router'

const router = useRouter()

// 回到首页：重置到根路由
function goHome() {
  router.push('/')
}

// 返回上一页：优先用历史栈回退，无历史记录时退回首页
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
/* 整页垂直水平居中 */
.notfound {
  /* 占满至少一屏高度，使内容视觉居中且不顶到页脚 */
  min-height: 72vh;
  display: grid;
  place-items: center;
  text-align: center;
}

.notfound-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

/* 404 大字号：蓝→橙渐变文字，呼应全站主视觉 */
.notfound-code {
  font-size: 140px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  margin: 0;
  background: var(--grad-hero);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

/* 主标题 */
.notfound-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--title);
  margin: 8px 0 0;
}

/* 说明文案 */
.notfound-desc {
  font-size: 16px;
  line-height: 1.7;
  opacity: 0.78;
  color: var(--text);
  margin: 12px 0 0;
}

/* 按钮区 */
.notfound-actions {
  display: flex;
  gap: 14px;
  margin-top: 28px;
  flex-wrap: wrap;
  justify-content: center;
}

/* 移动端：缩小 404 字号、收紧间距 */
@media (max-width: 734px) {
  .notfound-code {
    font-size: 96px;
  }

  .notfound-title {
    font-size: 22px;
  }

  .notfound-desc {
    font-size: 14.5px;
  }

  .notfound-actions {
    margin-top: 22px;
  }
}
</style>
