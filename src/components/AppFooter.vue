<!-- ===== 页脚组件 AppFooter：展示版权年份与站点说明 ===== -->
<template>
  <footer class="footer">
    <div class="container">
      © {{ currentYear }} {{ site.author }}. All Rights Reserved. Ver:{{ version }}
    </div>
  </footer>
</template>

<script setup>
// 版本号，直接读取 package.json 中的 version 字段
import { version } from '../../package.json'
// 站点配置（含作者名 author，用于页脚版权展示）
import { site } from '../data/site.js'
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
