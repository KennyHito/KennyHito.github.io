<!-- ===== 全屏烟花覆盖层：留言板评论发布成功时，从底部升空并炸开成烟花 =====
     透明 canvas 覆盖整个视口，pointer-events:none 不拦截任何点击；
     z-index 置顶，绘制在页面内容之上。动画全部结束后自动停止 RAF，零空转。 -->
<template>
  <canvas ref="canvas" class="fireworks-canvas" aria-hidden="true"></canvas>
</template>

<script setup>
// 引入 Vue 生命周期与响应式引用
import { ref, onMounted, onUnmounted } from 'vue'

// canvas 元素引用
const canvas = ref(null)
// 2D 上下文（resize 时重新取，确保 dpr 缩放正确）
let ctx = null
// 设备像素比，用于高清绘制
let dpr = 1
// RAF 句柄与运行标志（避免动画结束后空跑）
let rafId = null
let running = false

// 升空火箭与爆炸粒子集合
let rockets = []
let particles = []
// 爆竹炸开后的纸屑（红金暖色碎片，缓慢飘落、旋转）
let confetti = []
// 尚未发射（setTimeout 待触发）的火箭数：纳入收尾判断，避免 RAF 提前停止导致偶发不触发
let pending = 0

// 物理常量：重力让粒子下坠，摩擦让速度衰减
const GRAVITY = 0.05
const FRICTION = 0.985

// 是否开启「减少动态」系统设置（无障碍），开启则不播放烟花
function reducedMotion() {
  try {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch (e) {
    return false
  }
}

// 画布尺寸跟随视口，并按 dpr 放大像素密度保证清晰
function resize() {
  const c = canvas.value
  if (!c) return
  dpr = window.devicePixelRatio || 1
  c.width = Math.floor(window.innerWidth * dpr)
  c.height = Math.floor(window.innerHeight * dpr)
  c.style.width = window.innerWidth + 'px'
  c.style.height = window.innerHeight + 'px'
  ctx = c.getContext('2d')
  // 用 dpr 缩放坐标系，后续绘制统一用 CSS 像素
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

// 生成一枚升空火箭：从底部某 x 升起，到达 targetY 高度时爆炸
function spawnRocket(targetX, targetY) {
  rockets.push({
    x: targetX,
    y: window.innerHeight,
    vx: (Math.random() - 0.5) * 0.8, // 轻微横向漂移
    vy: -(8 + Math.random() * 3), // 初始向上速度
    targetY, // 到达该高度即爆炸
    hue: Math.floor(Math.random() * 360), // 该束烟花主色相
    trail: []
  })
}

// 在 (x, y) 处爆炸，生成一团四散的彩色粒子
function explode(x, y, hue) {
  const count = 60 + Math.floor(Math.random() * 40)
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 4 + 1.6
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      hue: hue + (Math.random() * 40 - 20), // 围绕主色相小幅抖动，更自然
      life: 1,
      decay: Math.random() * 0.012 + 0.008, // 透明度衰减速度
      trail: []
    })
  }
  // 同时抛洒爆竹纸屑（红金暖色碎片，缓慢飘落旋转）
  spawnConfetti(x, y)
}

// 在 (x, y) 处抛洒爆竹纸屑：五颜六色、形状千奇百怪，向外散开并缓慢飘落、旋转
function spawnConfetti(x, y) {
  // 形状库：矩形纸条 / 圆 / 三角 / 菱形 / 五角星 / 细线 / 卷曲纸条，随机挑选
  const shapes = ['rect', 'circle', 'triangle', 'diamond', 'star', 'line', 'strip']
  const count = 16 + Math.floor(Math.random() * 12)
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 2.4 + 0.6
    confetti.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (Math.random() * 2 + 1), // 略向上喷，再飘落
      size: 5 + Math.random() * 8, // 碎片大小，差异化更明显
      ratio: 0.4 + Math.random() * 0.7, // 长宽比，做成千奇百怪的纸条感
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.4, // 旋转速度
      // 五颜六色：HSL 全色相等概率，高饱和、中高亮度，鲜艳不灰
      color: `hsl(${Math.floor(Math.random() * 360)}, ${70 + Math.floor(Math.random() * 30)}%, ${52 + Math.floor(Math.random() * 16)}%)`,
      shape: shapes[Math.floor(Math.random() * shapes.length)], // 随机形状
      swing: Math.random() * Math.PI * 2, // 横向摆动相位
      swingSpeed: 0.02 + Math.random() * 0.035, // 摆动频率
      life: 1,
      decay: 0.0035 + Math.random() * 0.004 // 慢衰减，飘落过程更持久
    })
  }
}

// 绘制五角星路径（由调用方 fill），spikes 角数、outer/inner 内外半径
function drawStar(cx, cy, spikes, outer, inner) {
  let rot = -Math.PI / 2
  const step = Math.PI / spikes
  ctx.beginPath()
  ctx.moveTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer)
  for (let i = 0; i < spikes; i++) {
    rot += step
    ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner)
    rot += step
    ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer)
  }
  ctx.closePath()
}

// 绘制单枚纸屑：依据 shape 在已平移/旋转的坐标系中画出不同形状
function drawConfetti(c) {
  ctx.save()
  ctx.translate(c.x, c.y)
  ctx.rotate(c.rot)
  // 前段保持不透明，尾段渐隐，避免突兀消失
  ctx.globalAlpha = Math.max(0, Math.min(1, c.life * 1.4))
  ctx.fillStyle = c.color
  const s = c.size
  const r = c.ratio
  switch (c.shape) {
    case 'circle': // 圆/椭圆
      ctx.beginPath()
      ctx.ellipse(0, 0, s / 2, (s * r) / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'triangle': // 三角
      ctx.beginPath()
      ctx.moveTo(0, -s / 2)
      ctx.lineTo(s / 2, s / 2)
      ctx.lineTo(-s / 2, s / 2)
      ctx.closePath()
      ctx.fill()
      break
    case 'diamond': // 菱形
      ctx.beginPath()
      ctx.moveTo(0, -s / 2)
      ctx.lineTo((s * r) / 2, 0)
      ctx.lineTo(0, s / 2)
      ctx.lineTo(-(s * r) / 2, 0)
      ctx.closePath()
      ctx.fill()
      break
    case 'star': // 五角星
      drawStar(0, 0, 5, s / 2, s / 4)
      ctx.fill()
      break
    case 'line': // 细线
      ctx.fillRect(-s / 2, -s * 0.12, s, s * 0.24)
      break
    case 'strip': // 卷曲纸条：用折线 + 圆头描边模拟
      ctx.beginPath()
      ctx.moveTo(-s / 2, 0)
      ctx.lineTo(-s / 4, -s * 0.3)
      ctx.lineTo(0, s * 0.2)
      ctx.lineTo(s / 4, -s * 0.25)
      ctx.lineTo(s / 2, 0)
      ctx.lineWidth = s * 0.32
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = c.color
      ctx.stroke()
      break
    default: // 'rect' 细长纸条
      ctx.fillRect(-s / 2, -(s * r) / 2, s, s * r)
  }
  ctx.restore()
}

// 绘制一段渐隐拖尾：从旧位置到新位置，越新越亮越粗
function drawTrail(trail, color, width) {
  if (trail.length < 2) return
  for (let i = 1; i < trail.length; i++) {
    const a = i / trail.length
    ctx.beginPath()
    ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
    ctx.lineTo(trail[i].x, trail[i].y)
    ctx.strokeStyle = color
    ctx.globalAlpha = a
    ctx.lineWidth = width * a
    ctx.lineCap = 'round'
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

// 每帧主循环：清空 → 更新火箭 → 更新粒子 → 判断是否收尾
function tick() {
  const W = window.innerWidth
  const H = window.innerHeight
  ctx.clearRect(0, 0, W, H)
  // 叠加混合模式：粒子重叠处更亮，呈现发光质感
  ctx.globalCompositeOperation = 'lighter'

  // ---- 火箭：带长拖尾上升 ----
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i]
    r.trail.push({ x: r.x, y: r.y })
    if (r.trail.length > 7) r.trail.shift()
    r.x += r.vx
    r.y += r.vy
    r.vy += GRAVITY
    drawTrail(r.trail, `hsl(${r.hue}, 100%, 72%)`, 2.2)
    ctx.beginPath()
    ctx.arc(r.x, r.y, 2.3, 0, Math.PI * 2)
    ctx.fillStyle = `hsl(${r.hue}, 100%, 82%)`
    ctx.fill()
    // 到达目标高度即爆炸
    if (r.y <= r.targetY) {
      explode(r.x, r.y, r.hue)
      rockets.splice(i, 1)
    }
  }

  // ---- 爆炸粒子：四散、下坠、渐隐 ----
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.trail.push({ x: p.x, y: p.y })
    if (p.trail.length > 5) p.trail.shift()
    p.vx *= FRICTION
    p.vy *= FRICTION
    p.vy += GRAVITY
    p.x += p.vx
    p.y += p.vy
    p.life -= p.decay
    if (p.life <= 0) {
      particles.splice(i, 1)
      continue
    }
    drawTrail(p.trail, `hsla(${p.hue}, 100%, 62%, ${p.life})`, 1.7)
    ctx.beginPath()
    ctx.arc(p.x, p.y, 1.9, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${p.hue}, 100%, ${62 + p.life * 18}%, ${p.life})`
    ctx.fill()
  }

  // 恢复默认混合模式
  ctx.globalCompositeOperation = 'source-over'

  // ---- 爆竹纸屑：缓慢飘落、左右摇摆、旋转淡出（实体碎片用正常混合）----
  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i]
    c.vy += 0.05 // 重力，纸片慢慢下坠
    c.x += c.vx + Math.sin(c.swing) * 0.7 // 横向摆动，模拟纸片飘落
    c.y += c.vy
    c.swing += c.swingSpeed
    c.vx *= 0.98
    c.rot += c.vrot
    c.life -= c.decay
    // 落出底部或寿命耗尽则移除
    if (c.life <= 0 || c.y > H + 30) {
      confetti.splice(i, 1)
      continue
    }
    drawConfetti(c)
  }
  ctx.globalAlpha = 1

  // 火箭、粒子、纸屑都已清空，且没有待发射的火箭后才停止循环，并清一次画布
  if (rockets.length === 0 && particles.length === 0 && confetti.length === 0 && pending === 0) {
    running = false
    rafId = null
    ctx.clearRect(0, 0, W, H)
    return
  }
  rafId = requestAnimationFrame(tick)
}

// 对外暴露：发射 count 束烟花，统一从底部中央升空、在屏幕正中央（偏上）炸开
function launch(count = 5) {
  if (reducedMotion()) return // 尊重无障碍设置
  if (!canvas.value) return
  // 爆炸中心：水平正中、垂直约 42% 视口高度（屏幕中央偏上，绽放最舒展）
  const centerX = window.innerWidth / 2
  const burstY = window.innerHeight * 0.42
  // 同步发射第一枚：保证 RAF 启动首帧就有活干，杜绝「空数组误停」导致的偶发不触发
  spawnRocket(centerX, burstY)
  // 其余各束围绕中心小幅水平分散（±80/±160…），避免完全重叠，并形成连续绽放
  for (let i = 1; i < count; i++) {
    const offset = (i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2) * 80
    pending += 1
    setTimeout(() => {
      pending -= 1
      spawnRocket(centerX + offset, burstY)
    }, i * 220)
  }
  // 启动渲染循环（若已在运行则跳过，避免重复 RAF）
  if (!running) {
    running = true
    rafId = requestAnimationFrame(tick)
  }
}

// 供父组件（App）通过 ref 调用
defineExpose({ launch })

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
})

onUnmounted(() => {
  window.removeEventListener('resize', resize)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
/* 全屏透明覆盖层：置顶、不拦截鼠标事件，绘制在页面内容之上 */
.fireworks-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}
</style>
