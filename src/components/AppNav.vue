<script setup>
import ThemeToggle from './ThemeToggle.vue'

defineProps({
  tabs: { type: Array, required: true },
  current: { type: String, required: true }
})
const emit = defineEmits(['switch'])
</script>

<template>
  <nav class="nav">
    <div class="nav-left">
      <button class="nav-logo" @click="emit('switch', 'home')" aria-label="返回首页" title="返回首页">
        <img src="/main_icon.png" alt="知识分享站" width="32" height="32" />
      </button>
    </div>
    <div class="nav-tabs">
      <a v-for="t in tabs" :key="t.key" class="tab" :class="{ active: t.key === current }"
        @click.prevent="emit('switch', t.key)">{{ t.label }}</a>
    </div>
    <div class="nav-actions">
      <ThemeToggle />
      <a class="nav-github" href="https://github.com/KennyHito" target="_blank" rel="noopener"
        aria-label="前往 GitHub">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.41 7.86 10.94.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.69-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.07 0 0 .96-.31 3.15 1.18a10.98 10.98 0 0 1 5.76 0c2.18-1.49 3.14-1.18 3.14-1.18.63 1.6.24 2.78.12 3.07.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.24 5.69.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56C20.72 21.4 24 17.08 24 12c0-6.35-5.15-11.5-11.5-11.5z" />
        </svg>
      </a>
    </div>
  </nav>
</template>
