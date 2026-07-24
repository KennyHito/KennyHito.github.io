import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // 开发服务器相关配置
  server: {
    // 监听所有地址（便于局域网/容器访问）
    host: true,
    // 本地开发服务器端口；macOS 上 80 为特权端口需 sudo，改用默认的 5173 避免权限错误
    port: 5173
  }
})
