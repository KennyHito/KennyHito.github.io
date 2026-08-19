// ===== 组合式函数：左侧目录展开 / 收起拖拽条 =====
// 目录拖拽条 composable
// 工具页 / 资讯页左侧目录的展开/收起交互：
// 1. 点击拖拽条：直接切换展开/收起；
// 2. 长按水平拖拽：目录跟随手柄位置实时伸缩，松手后按当前位置吸附到展开或收起。
// 使用 Pointer Events 统一处理鼠标与触摸（PointerEvent 同样含 clientX/clientY），
// 配合 CSS touch-action:none，移动端拖拽不会被浏览器滚动抢走。
import { ref, computed, watch } from 'vue'

/**
 * @param {Object} options
 * @param {number} [options.handleOpenLeft=150]   展开时拖拽条中心水平位置（px，即目录右边缘）
 * @param {number} [options.handleClosedLeft=20]  收起时拖拽条中心水平位置（px，即屏幕左边缘）
 * @param {number} [options.closedOffset=150]     目录完全收起时的水平偏移（px，正数，目录宽度 + 左偏移）
 * @returns {{ tocOpen: import('vue').Ref, tocStyle: import('vue').ComputedRef,
 *            handleStyle: import('vue').ComputedRef, onHandlePointerDown: Function }}
 */
export function useTocDrag(options = {}) {
  const handleOpenLeft = options.handleOpenLeft ?? 150
  const handleClosedLeft = options.handleClosedLeft ?? 20
  const closedOffset = options.closedOffset ?? 150

  // 桌面端左侧目录是否展开（横向展开/收起状态）
  const tocOpen = ref(true)
  // 拖拽中目录的水平偏移（px），null 表示非拖拽状态
  const dragX = ref(null)
  // 是否正处于拖拽（按下即 true，松手即 false），供气泡提示在拖拽时立即隐藏
  const isDragging = ref(false)

  let startClientX = 0   // 按下时的指针横坐标
  let startHandleLeft = 0 // 按下时拖拽条中心位置
  let dragging = false    // 是否已进入拖拽（移动超过阈值才置 true）

  function onHandlePointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return
    e.preventDefault()
    startClientX = e.clientX
    startHandleLeft = tocOpen.value ? handleOpenLeft : handleClosedLeft
    dragging = false
    // 按下即进入拖拽态：气泡提示立即隐藏（不等拖拽结束）
    isDragging.value = true
    // 按下即接管目录 transform（值不变，无跳动），供拖拽跟手 / 点击后平滑吸附
    dragX.value = tocOpen.value ? 0 : -closedOffset
    // 锁定全局选中，防止拖拽时选中文本
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onHandlePointerMove)
    window.addEventListener('pointerup', onHandlePointerUp)
    window.addEventListener('pointercancel', onHandlePointerUp)
  }

  function onHandlePointerMove(e) {
    const dx = e.clientX - startClientX
    // 移动距离小于 5px 视为点击，不进入拖拽
    if (!dragging && Math.abs(dx) < 5) return
    dragging = true
    // 拖拽条水平位置，钳制在收起 ~ 展开之间
    const left = Math.min(handleOpenLeft, Math.max(handleClosedLeft, startHandleLeft + dx))
    // 反算目录偏移：left = open → 0；left = closed → -closedOffset
    dragX.value = (left - handleOpenLeft) * (closedOffset / (handleOpenLeft - handleClosedLeft))
  }

  function onHandlePointerUp() {
    window.removeEventListener('pointermove', onHandlePointerMove)
    window.removeEventListener('pointerup', onHandlePointerUp)
    window.removeEventListener('pointercancel', onHandlePointerUp)
    document.body.style.userSelect = ''
    if (dragging) {
      // 拖拽松手：以中间位置为界吸附到展开或收起
      tocOpen.value = dragX.value > -closedOffset / 2
    } else {
      //  `未产生拖拽视为点击，直接切换开合
      tocOpen.value = !tocOpen.value
    }
    dragX.value = null
    // 拖拽结束，气泡提示恢复按 tocOpen 判断是否显示
    isDragging.value = false
  }

  // 目录元素内联样式：拖拽时覆盖 transform 并关闭过渡（跟手），非拖拽时交给 class 平滑过渡
  const tocStyle = computed(() =>
    dragX.value !== null
      ? { transform: `translateX(${dragX.value}px)`, transition: 'none' }
      : undefined
  )

  // 拖拽条水平位置：拖拽中由目录偏移反算，否则按开合状态
  const handleLeft = computed(() =>
    dragX.value !== null
      ? handleOpenLeft + (dragX.value / closedOffset) * (handleOpenLeft - handleClosedLeft)
      : tocOpen.value
        ? handleOpenLeft
        : handleClosedLeft
  )

  // 拖拽条内联样式：水平位置 + 拖拽时关闭过渡
  const handleStyle = computed(() => ({
    left: handleLeft.value + 'px',
    transition: dragX.value !== null ? 'none' : 'left 0.3s ease',
  }))

  // 同步拖拽条中心位置到全局 CSS 变量，供 TocCollapsedHint 跟随定位
  watch(handleLeft, (val) => {
    document.documentElement.style.setProperty('--toc-handle-left', val + 'px')
  }, { immediate: true })

  return { tocOpen, tocStyle, handleStyle, onHandlePointerDown, isDragging }
}
