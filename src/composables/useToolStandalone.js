// ===== 组合式函数：工具页独立模式（隐藏全局导航 / 锁定整页滚动）=====
// 工具页独立模式
// 进入工具页时给 body 添加 tool-standalone 类（隐藏站点全局导航栏 / 页脚 / 返回顶部按钮，
// 并锁定整页不滚动），离开时移除，让工具页聚焦自身。
import { onMounted, onUnmounted } from 'vue'

export function useToolStandalone() {
  onMounted(() => document.body.classList.add('tool-standalone'))
  onUnmounted(() => document.body.classList.remove('tool-standalone'))
}
