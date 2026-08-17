// ===== 组合式函数：拖拽分割面板（桌面左右 / 移动端上下）=====
// 拖拽分割面板 composable
// 桌面端左右拖拽调整两侧面板宽度，移动端上下拖拽调整上下面板高度。
// 使用 Pointer Events 统一处理鼠标与触摸（PointerEvent 同样含 clientX/clientY），
// 配合 CSS touch-action:none，移动端拖拽不会被浏览器滚动抢走。
import { ref, computed } from 'vue'

/**
 * @param {Object} options
 * @param {number} [options.initialWidth=50]  桌面端左侧面板初始宽度百分比
 * @param {number} [options.initialHeight=50] 移动端上方面板初始高度百分比
 * @param {number} [options.min=20]           面板占比最小百分比
 * @param {number} [options.max=80]           面板占比最大百分比
 * @param {number} [options.breakpoint=760]   移动端判定宽度阈值（px）
 * @param {number} [options.heightOffset=7]   高度让位像素（为拖拽条让位，保证两区严格对半）
 * @returns {{ mainRef: import('vue').Ref, paneStyle: import('vue').ComputedRef, resizing: import('vue').Ref, startResize: Function }}
 */
export function useSplitPane(options = {}) {
  const mainRef = ref(null)
  const leftWidth = ref(options.initialWidth ?? 50)   // 桌面端：左侧面板宽度百分比
  const topHeight = ref(options.initialHeight ?? 50)  // 移动端：上方面板高度百分比
  const resizing = ref(false) // 是否正在拖拽（驱动拖拽条高亮）
  const breakpoint = options.breakpoint ?? 760
  const minPct = options.min ?? 20
  const maxPct = options.max ?? 80
  const heightOffset = options.heightOffset ?? 7

  // 面板内联尺寸：同时输出 width/height，桌面用 width、移动用 height，另一项由 CSS 忽略
  // 高度 -heightOffsetpx：为拖拽条让位，保证默认时两区严格各占一半
  const paneStyle = computed(() => ({
    width: leftWidth.value + '%',
    height: 'calc(' + topHeight.value + '% - ' + heightOffset + 'px)'
  }))

  // 当前拖拽方向：'x' 桌面左右、'y' 移动上下，按触发时窗口宽度实时决定
  let resizeDir = 'x'

  // 拖拽中：按 resizeDir 更新宽度或高度，均限制在 minPct ~ maxPct
  function onResize(e) {
    if (!resizing.value || !mainRef.value) return
    const rect = mainRef.value.getBoundingClientRect()
    if (resizeDir === 'y') {
      let pct = ((e.clientY - rect.top) / rect.height) * 100
      topHeight.value = Math.min(maxPct, Math.max(minPct, pct))
    } else {
      let pct = ((e.clientX - rect.left) / rect.width) * 100
      leftWidth.value = Math.min(maxPct, Math.max(minPct, pct))
    }
  }

  // 开始拖拽：锁定全局选中（防拖拽时选中文本），注册全局指针监听
  function startResize(e) {
    resizing.value = true
    resizeDir = window.innerWidth <= breakpoint ? 'y' : 'x'
    try { e.target.setPointerCapture(e.pointerId) } catch (_) { } // 指针移出元素后仍持续收到事件
    document.body.style.userSelect = 'none'
    document.addEventListener('pointermove', onResize)
    document.addEventListener('pointerup', stopResize)
    document.addEventListener('pointercancel', stopResize)
    e.preventDefault()
  }

  // 结束拖拽：恢复选中，移除全局监听
  function stopResize() {
    resizing.value = false
    document.body.style.userSelect = ''
    document.removeEventListener('pointermove', onResize)
    document.removeEventListener('pointerup', stopResize)
    document.removeEventListener('pointercancel', stopResize)
  }

  return { mainRef, paneStyle, resizing, startResize }
}
