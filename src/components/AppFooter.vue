<!-- ===== 页脚组件 AppFooter：展示版权年份与站点说明 ===== -->
<template>
  <footer class="footer">
    <div class="container">
      © {{ currentYear }} 知识分享站 ｜ 个人分享 · 仅供学习
    </div>
  </footer>
</template>

<script setup>
// 当前年份，用于页脚版权显示
const currentYear = new Date().getFullYear()
</script>

<style scoped>
/* 页脚：内容居中，仅显示文字 */
.footer {
  padding: 32px 0;
  text-align: center;
  color: var(--text);
  opacity: 0.7;
  font-size: 13px;
  /* 加粗显示 */
  font-weight: 600;
}
</style>
