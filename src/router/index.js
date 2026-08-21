// ===== 路由配置：集中管理全站页面路由 =====
// 采用 createWebHashHistory（哈希路由），适配 GitHub Pages 静态托管：
//   - 无需服务端重写规则，任意静态路径均可直接返回 index.html
//   - 路由形如 #/tools/jsonviewer，兼容原有工具子页的哈希链接跳转
import { createRouter, createWebHashHistory } from 'vue-router'

// 主页面
import HomePage from '../pages/HomePage.vue'
import ToolsPage from '../pages/ToolsPage.vue'
import NewsPage from '../pages/NewsPage.vue'
import AboutPage from '../pages/AboutPage.vue'
import NotFound from '../pages/NotFound.vue'

// 工具子页面（站内独立工具，通过 #/tools/<sub> 访问）
import JsonViewer from '../pages/tools/JsonViewer.vue'
import PwdGenerator from '../pages/tools/PwdGenerator.vue'
import Base64Codec from '../pages/tools/Base64Codec.vue'
import Md5Hash from '../pages/tools/Md5Hash.vue'
import UrlCodec from '../pages/tools/UrlCodec.vue'
import ImageBase64 from '../pages/tools/ImageBase64.vue'
import ColorConverter from '../pages/tools/ColorConverter.vue'
import FileDiff from '../pages/tools/FileDiff.vue'

// 工具子页映射：hash 子路径 -> 组件，新增工具子页在此登记一处即可
export const toolSubPages = {
  jsonviewer: JsonViewer,
  pwdgenerator: PwdGenerator,
  base64codec: Base64Codec,
  md5hash: Md5Hash,
  urlcodec: UrlCodec,
  imagebase64: ImageBase64,
  colorconverter: ColorConverter,
  filediff: FileDiff
}

// 由映射自动生成 /tools/<sub> 子路由（无 name，避免与 /tools 主路由重名告警）
const toolSubRoutes = Object.entries(toolSubPages).map(([sub, comp]) => ({
  path: '/tools/' + sub,
  component: comp
}))

// 留言板路由占位组件：App.vue 通过 v-show 单独常驻渲染 MessageBoard（避免 Giscus iframe 重载），
// 因此此处组件内容为空，仅作为路由锚点（使 route.name 正确等于 'message' 并防止落入 404 兜底）
const messageStub = { render: () => null }

const routes = [
  { path: '/', name: 'home', component: HomePage },
  // 兼容旧链接 #/home 以及导航回首页的 push('/home')
  { path: '/home', redirect: '/' },
  { path: '/tools', name: 'tools', component: ToolsPage },
  ...toolSubRoutes,
  { path: '/news', name: 'news', component: NewsPage },
  { path: '/message', name: 'message', component: messageStub },
  { path: '/about', name: 'about', component: AboutPage },
  // 兜底：匹配所有未定义路由 -> 自定义 404 页
  { path: '/:pathMatch(.*)*', name: 'notfound', component: NotFound }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  // 路由切换后滚动到顶部（替代原 onHashChange 中的 scrollTo）
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
