<template>
    <div class="thought-wrap" v-if="showBubble">
        <svg width="240" height="220" viewBox="0 0 340 320">
            <path
                d="M170 45 C235 12,295 68,282 128 C302 190,238 250,170 238 C98 258,35 195,54 126 C24 74,108 24,170 45Z"
                fill="#ffffff" stroke="#111111" stroke-width="7" />
            <circle cx="42" cy="278" r="12" fill="#fff" stroke="#111" stroke-width="7" />
            <circle cx="96" cy="282" r="15" fill="#fff" stroke="#111" stroke-width="7" />
            <circle cx="158" cy="258" r="22" fill="#fff" stroke="#111" stroke-width="7" />
        </svg>
        <div class="inner-content">
            点击和拖拽可以打开目录
            <div class="ok-btn" @click="handleOk">OK</div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useToolStandalone } from '../composables/useToolStandalone';
useToolStandalone()
// 控制气泡显示隐藏
const showBubble = ref(true)

const handleOk = () => {
    showBubble.value = false
}
</script>

<style scoped>
.thought-wrap {
    position: relative;
    width: 240px;
}

.inner-content {
    position: absolute;
    top: 52px;
    left: 48px;
    right: 32px;
    font-size: 15px;
    color: #222;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.ok-btn {
    width: 64px;
    align-self: center;
    text-align: center;
    padding: 4px 0;
    border: 2px solid #333;
    border-radius: 6px;
    cursor: pointer;
    background: #fff;
}

.ok-btn:hover {
    background: #eee;
}
</style>