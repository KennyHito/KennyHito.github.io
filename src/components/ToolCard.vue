<template>
  <div class="card tool-card">
    <h3>{{ tool.name }}</h3>
    <p class="desc">{{ tool.desc }}</p>

    <template v-if="tool.example">
      <p class="sub"><span class="example-name">{{ tool.example }}</span></p>
      <p class="sub">{{ tool.exampleDesc }}</p>
    </template>

    <template v-if="tool.steps && tool.steps.length">
      <p class="sub">使用教程</p>
      <ol class="steps">
        <li v-for="(s, i) in tool.steps" :key="i">{{ s }}</li>
      </ol>
    </template>

    <template v-if="tool.scenarios && tool.scenarios.length">
      <p class="sub">核心使用场景</p>
      <div class="chips">
        <span class="chip" v-for="(c, i) in tool.scenarios" :key="i">{{ c }}</span>
      </div>
    </template>

    <template v-if="tool.features && tool.features.length">
      <p class="sub">核心功能</p>
      <div class="chips">
        <span class="chip" v-for="(f, i) in tool.features" :key="i">{{ f }}</span>
      </div>
    </template>

    <a class="btn btn-primary" :href="tool.link" target="_blank" rel="noopener noreferrer">
      {{ tool.linkText }} ↗
    </a>
  </div>
</template>

<script setup>
defineProps({
  tool: { type: Object, required: true }
})
</script>

<style scoped>
/* ===== 工具卡 ===== */
.tool-card h3 {
  font-size: 21px;
  font-weight: 600;
  margin-bottom: 10px;
}

.tool-card .desc {
  font-size: 15px;
  opacity: 0.82;
  margin-bottom: 16px;
}

.tool-card .sub {
  font-size: 14px;
  opacity: 0.7;
  margin: 8px 0 4px;
}

.tool-card .example-name {
  font-weight: 600;
  color: var(--title);
}

/* ===== 列表（步骤 / 标签） ===== */
.steps {
  /* 去掉原生序号 */
  list-style: none;
  /* 初始化计数器 */
  counter-reset: step;
  margin: 16px 0 20px;
}

.steps li {
  /* 每项自增计数 */
  counter-increment: step;
  position: relative;
  /* 给左侧圆形序号留位置 */
  padding-left: 34px;
  margin-bottom: 12px;
  font-size: 15px;
  opacity: 0.85;
}

/* 用伪元素绘制圆形步骤序号 */
.steps li::before {
  content: counter(step);
  position: absolute;
  left: 0;
  top: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  display: grid;
  place-items: center;
}

/* 标签云容器 */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 12px 0 20px;
}

.chip {
  font-size: 14px;
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border);
}
</style>
