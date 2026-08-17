// ===== 数据：页面导航（tab）配置 =====
// 页面导航配置：key 标识、label 显示文案、comp 对应页面组件
// 新增 / 调整导航页时只改这里
import HomePage from '../pages/HomePage.vue'
import ToolsPage from '../pages/ToolsPage.vue'
import NewsPage from '../pages/NewsPage.vue'
import AboutPage from '../pages/AboutPage.vue'

export const tabs = [
  { key: 'home', label: '首页', comp: HomePage },
  { key: 'tools', label: '工具', comp: ToolsPage },
  { key: 'news', label: '资讯', comp: NewsPage },
  { key: 'about', label: '关于', comp: AboutPage }
]
