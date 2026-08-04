import { onMounted, onUnmounted } from 'vue'

/**
 * useMasonry —— 轻量 JS 瀑布流（Masonry）布局
 * 将容器内的直接子元素按内容高度依次放入「当前最短的列」，
 * 使用绝对定位实现卡片紧密堆叠、无间隙，左右无需等高。
 *
 * @param {Ref<HTMLElement>} containerRef 瀑布流容器的模板引用
 * @param {Object} [options]
 * @param {number} [options.gap=20]            列间距 / 卡片垂直间距(px)
 * @param {number} [options.maxCols=3]         桌面端最大列数
 * @param {number} [options.breakpoint2=980]   2 列断点(px，<= 该值用 2 列)
 * @param {number} [options.breakpoint1=734]   1 列断点(px，<= 该值用单列普通流)
 */
export function useMasonry(containerRef, options = {}) {
  const gap = options.gap ?? 20
  const maxCols = options.maxCols ?? 3
  const bp2 = options.breakpoint2 ?? 980
  const bp1 = options.breakpoint1 ?? 734

  let ro = null

  function getCols() {
    const w = window.innerWidth
    if (w <= bp1) return 1
    if (w <= bp2) return Math.min(2, maxCols)
    return maxCols
  }

  // 重置为普通流，便于测量元素真实高度
  function reset(el, items) {
    el.style.position = 'relative'
    el.style.height = ''
    for (const item of items) {
      item.style.position = ''
      item.style.top = ''
      item.style.left = ''
      item.style.width = ''
    }
  }

  function layout() {
    const el = containerRef.value
    if (!el) return
    const items = Array.from(el.children)
    if (!items.length) return

    const cols = getCols()

    // 单列时无需绝对定位，直接回到普通文档流
    if (cols === 1) {
      reset(el, items)
      el.style.position = ''
      el.style.height = ''
      return
    }

    // 先重置，确保拿到未受定位影响的内容高度
    reset(el, items)
    el.style.position = 'relative'

    const containerWidth = el.clientWidth
    const itemWidth = (containerWidth - gap * (cols - 1)) / cols
    const colHeights = new Array(cols).fill(0)

    for (const item of items) {
      const minIdx = colHeights.indexOf(Math.min(...colHeights))
      const top = colHeights[minIdx]
      const left = minIdx * (itemWidth + gap)

      item.style.position = 'absolute'
      item.style.top = `${top}px`
      item.style.left = `${left}px`
      item.style.width = `${itemWidth}px`

      // 累加该列高度（含卡片自身高度与间距）
      colHeights[minIdx] = top + item.offsetHeight + gap
    }

    // 容器高度撑到最底列
    el.style.height = `${Math.max(...colHeights)}px`
  }

  onMounted(() => {
    layout()
    ro = new ResizeObserver(layout)
    if (containerRef.value) ro.observe(containerRef.value)
    window.addEventListener('resize', layout, { passive: true })
  })

  onUnmounted(() => {
    if (ro) ro.disconnect()
    window.removeEventListener('resize', layout)
  })

  return { layout }
}
