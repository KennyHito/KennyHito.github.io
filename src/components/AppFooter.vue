<!-- ===== 页脚组件 AppFooter：展示版权年份、站点说明与不蒜子访问统计 ===== -->
<template>
  <footer class="footer">
    <div class="container">
      © {{ currentYear }} {{ site.author }}. All Rights Reserved. Ver:{{ version }}
    </div>
    <!-- 不蒜子站点统计：容器初始隐藏（display:none），busuanzi 脚本加载成功后自动显示 -->
    <div class="busuanzi-stats">
      <span id="busuanzi_container_site_pv" style="display: none">
        总访问量 <span id="busuanzi_value_site_pv"></span> 次
      </span>
      <span id="busuanzi_container_site_uv" style="display: none">
        访客数 <span id="busuanzi_value_site_uv"></span> 人
      </span>
    </div>
  </footer>
</template>

<script setup>
// 版本号，直接读取 package.json 中的 version 字段
import { version } from '../../package.json'
// 站点配置（含作者名 author，用于页脚版权展示）
import { site } from '../data/site.js'
// 不蒜子统计 composable：挂载后动态注入 busuanzi 脚本（SPA 适配）
import { useBusuanzi } from '../composables/useBusuanzi.js'
// 当前年份，用于页脚版权显示
const currentYear = new Date().getFullYear()
// 注入不蒜子脚本（在组件挂载后，确保容器 span 已在 DOM 中）
useBusuanzi()
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

/* 不蒜子统计：紧随版权行下方，更小更淡 */
.busuanzi-stats {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 400;
  opacity: 0.85;
}

/* 统计项之间的分隔符：用 CSS 伪元素实现，隐藏时自动消失 */
#busuanzi_container_site_pv::after {
  content: '\00b7';
  margin: 0 8px;
  opacity: 0.5;
}
</style>
