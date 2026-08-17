<!-- ===== 图标组件 AppIcon：根据 name 统一渲染各 SVG 矢量图标 ===== -->
<template>
  <svg
    class="app-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :style="{ width: sizeStyle, height: sizeStyle }"
    aria-hidden="true"
  >
    <!-- sun：太阳（中心圆 + 八条光线） -->
    <template v-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path :d="iconSun" />
    </template>
    <!-- moon：月亮 -->
    <path v-else-if="name === 'moon'" :d="iconMoon" />
    <!-- menu：汉堡（移动端菜单） -->
    <template v-else-if="name === 'menu'">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </template>
    <!-- close：关闭 -->
    <template v-else-if="name === 'close'">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </template>
    <!-- chevron-left：左箭头（资讯目录） -->
    <path v-else-if="name === 'chevron-left'" :d="iconChevronLeft" />
    <!-- arrow-up：上箭头（回到顶部） -->
    <path v-else-if="name === 'arrow-up'" :d="iconArrowUp" />
    <!-- github：填充型（忽略描边） -->
    <path v-else-if="name === 'github'" :d="iconGithub" fill="currentColor" stroke="none" />
    <!-- home：首页 -->
    <template v-else-if="name === 'home'">
      <path :d="iconHome" />
      <path :d="iconHomeDoor" />
    </template>
    <!-- tools：工具 -->
    <path v-else-if="name === 'tools'" :d="iconTools" />
    <!-- news：资讯 -->
    <path v-else-if="name === 'news'" :d="iconNews" />
    <!-- about：关于 -->
    <template v-else-if="name === 'about'">
      <path :d="iconAbout" />
      <circle cx="12" cy="7" r="4" />
    </template>
    <!-- mail：邮箱 -->
    <template v-else-if="name === 'mail'">
      <path :d="iconMail" />
      <path :d="iconMailFlap" />
    </template>
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import {
  iconSun, iconMoon, iconChevronLeft, iconArrowUp, iconGithub,
  iconHome, iconHomeDoor, iconTools, iconNews, iconAbout, iconMail, iconMailFlap
} from '../data/path.js'

// 组件属性：name 指定图标名称，size 控制边长，strokeWidth 控制描边宽度
const props = defineProps({
  // 图标名称：sun / moon / menu / close / chevron-left / arrow-up / github / home / tools / news / about / mail
  name: { type: String, required: true },
  // 图标边长：数字按 px，字符串按原样（如 '1em'）
  size: { type: [Number, String], default: 20 },
  // 描边宽度（github 为填充型，忽略此值）
  strokeWidth: { type: [Number, String], default: 2.2 }
})

const sizeStyle = computed(() =>
  typeof props.size === 'number' ? props.size + 'px' : props.size
)
</script>
