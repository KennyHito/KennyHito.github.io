<template>
    <div class="thought-bubble-wrap">
        <!-- 思考气泡svg -->
        <svg width="320" height="300" viewBox="0 0 320 300">
            <!-- 云朵思考框 -->
            <path
                d="M160 40 C220 10,280 60,270 120 C290 180,230 240,160 230 C90 250,30 190,50 120 C20 70,100 20,160 40Z"
                fill="#fff" stroke="#222" stroke-width="8" />
            <!-- 尾巴三个圆点 -->
            <circle cx="40" cy="260" r="14" fill="#fff" stroke="#222" stroke-width="8" />
            <circle cx="90" cy="265" r="18" fill="#fff" stroke="#222" stroke-width="8" />
            <circle cx="150" cy="245" r="26" fill="#fff" stroke="#222" stroke-width="8" />
        </svg>
        <!-- 气泡内文字内容，绝对定位放在云朵里面 -->
        <div class="bubble-text">这里放思考的文字内容</div>
    </div>
</template>
<script setup>
import { useToolStandalone } from '../composables/useToolStandalone.js'
/* ---------- 隐藏站点全局导航栏（tool-standalone 模式） ---------- */
useToolStandalone()
</script>
<style scoped>
.thought-bubble-wrap {
    position: relative;
    width: 320px;
    height: 300px;
}

.bubble-text {
    position: absolute;
    top: 60px;
    left: 60px;
    right: 40px;
    font-size: 16px;
}
</style>