// ===== 应用入口：创建并挂载 Vue 应用 =====
// 从 Vue 框架中导入 createApp 方法，用于创建应用实例
import { createApp } from 'vue'
// 导入根组件 App
import App from './App.vue'
// 导入路由配置（集中管理全站页面路由）
import router from './router/index.js'
// 导入全局样式文件
import './style.css'
// 导入主题切换相关的组合式函数（副作用导入，用于初始化主题）
import './composables/useTheme.js'

// 创建 Vue 应用实例，挂载路由插件与根组件 App，渲染到 id 为 #app 的 DOM 节点
createApp(App).use(router).mount('#app')
