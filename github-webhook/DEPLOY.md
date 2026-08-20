# GitHub Discussions → 飞书 通知（Cloudflare Worker）

把仓库 Discussions 的「新评论 / 嵌套回复」主动推送到飞书，
弥补前端 Giscus 纯前端方案拿不到嵌套回复的短板。

## 整体链路

```
GitHub 仓库（评论/回复）
   │  GitHub Webhook 主动 POST（带 X-Hub-Signature-256 签名）
   ▼
Cloudflare Worker（验签 → 解析 → 组装）
   │  fetch 飞书 webhook
   ▼
飞书机器人 → 收到带 用户名 + 内容 + 链接 的提醒
```

## 一、部署 Worker

### 方式 A：Cloudflare Dashboard（最简单）

1. 登录 <https://dash.cloudflare.com> → **Workers & Pages** → **Create Worker**
2. 命名如 `gh-discussions-feishu`，把 `worker.js` 内容粘贴进编辑器，保存
3. 进入该 Worker → **Settings → Variables**
   - `FEISHU_WEBHOOK`（类型选 **Secret**）：填飞书 webhook 地址
     `https://open.feishu.cn/open-apis/bot/v2/hook/834ca0ac-de7a-49be-bb1f-4ee995e45b56`
   - `GH_SECRET`（类型选 **Secret**）：随意一串字符串，稍后填到 GitHub Webhook（两边必须一致）
   - `SITE_NAME`（普通变量，可选）：站点展示名，填域名如 `devnote.site`；填完整 URL 如 `https://devnote.site` 也会自动解析出域名
   - `IGNORE_AUTHOR`（普通变量，可选）：`KennyHito`（排除站主自己触发；留空则不过滤）
4. 部署后复制 Worker 地址，形如
   `https://gh-discussions-feishu.<你的子域>.workers.dev`

### 方式 B：wrangler CLI

```bash
npm i -g wrangler && wrangler login
cd github-webhook
wrangler deploy            # 部署 worker.js（需同级 wrangler.toml，见下）

# 设置敏感变量（交互输入，不会落盘到文件）
wrangler secret put FEISHU_WEBHOOK
wrangler secret put GH_SECRET
```

`wrangler.toml`（普通变量可写这里，Secret 用上面的 secret put）：

```toml
name = "gh-discussions-feishu"
main = "worker.js"
compatibility_date = "2024-09-23"

[vars]
SITE_NAME = "devnote.site"
IGNORE_AUTHOR = "KennyHito"
```

## 二、配置 GitHub Webhook

1. 打开仓库 **KennyHito/KennyHito.github.io** → **Settings → Webhooks → Add webhook**
2. **Payload URL**：上面的 Worker 地址
3. **Content type**：`application/json`
4. **Secret**：与 Worker 里的 `GH_SECRET` **完全一致**
5. **SSL verification**：保持勾选（默认）
6. **Which events**：选 **Let me select individual events**，仅勾选：
   - ✅ **Discussion comments**
   （不要勾 Push / Pull requests 等无关事件）
7. **Active** 保持勾选，保存

## 三、验证

在 GitHub Discussions 做以下操作，飞书应收到提醒：

| 操作 | 飞书提醒 |
|------|----------|
| 发一条新评论 | 网站devnote.site 收到新评论 + 用户 + 内容 + 链接 |
| 回复某条评论 | 网站devnote.site 收到新回复 + 用户 + 内容 + 链接 |

若未收到，排查：

- **Worker 日志**：dash.cloudflare.com → 对应 Worker → **Logs**（实时）
- **GitHub 投递记录**：仓库 Settings → Webhooks → 点该 webhook → **Recent Deliveries**
  看返回码：200 = 成功；401 = GH_SECRET 不一致；500 = Worker 代码异常（看 Response Body 错误信息）；502 = 飞书推送失败
- **验签失败**：确认 GitHub Webhook 的 Secret 与 Worker 的 `GH_SECRET` 一字不差

## 四、与前端方案的关系

- 前端 `GiscusComments.vue` 的纯前端通知（仅顶层新评论）**可以保留也可以移除**：
  - 保留：双通道提醒（GitHub 事件 + Giscus 轮询），但同一条评论会收到两条飞书。
  - 移除：删掉 `onGiscusMessage` 里的 `notifyFeishu` 调用即可，避免重复。
  - 推荐：**移除前端推送**，统一走本 Worker（覆盖更全、内容更完整）。

## 注意事项

- GitHub Webhook 自带失败自动重试，无需自管队列。
- **签名验证必须保留**，否则任何人都可向你的飞书机器人灌消息。
- 站主自己评论也会触发；如不想收到，把 `IGNORE_AUTHOR` 设为 `KennyHito`。
- ⚠️ GitHub 的 `reaction` Webhook 事件**不覆盖 Discussions**（仅 Issue/PR/Commit 评论才触发），故「点赞/表情」无法通过本方案通知，`worker.js` 已移除对应分支。
