<script setup>
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container">
      © {{ currentYear }} 知识分享站 ｜ 个人分享 · 仅供学习
    </div>
  </footer>
</template>

<style scoped>
/* 页脚：顶部细分割线，内容居中 */
.footer {
  border-top: 1px solid var(--border);
  padding: 32px 0;
  text-align: center;
  color: var(--text);
  opacity: 0.7;
  font-size: 13px;
  transition: border-color var(--transition);
}
</style>
