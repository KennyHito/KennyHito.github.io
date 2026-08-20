// ===== GitHub Discussions → 飞书通知（Cloudflare Worker）=====
// 覆盖范围：新评论、嵌套回复
// 与前端纯 Giscus 方案互补：前端拿不到嵌套回复，本 Worker 由 GitHub 主动推送，
// 可拿到完整作者、正文、链接。
//
// 注意：GitHub 的 `reaction` webhook 事件不覆盖 Discussions（仅 Issue/PR/Commit 评论触发），
// 因此「点赞/表情」无法通过 Webhook 通知，故此处已移除该分支。
//
// 需在 Worker 环境变量 / Secrets 中配置：
//   FEISHU_WEBHOOK  (建议 Secret) 飞书机器人 webhook 地址（URL 含 token，放 Secret 更安全）
//   GH_SECRET       (必须 Secret) GitHub Webhook 设置的 Secret（用于验签，防伪造）
//   SITE_NAME       (普通变量)      站点展示名，默认 devnote.site
//   IGNORE_AUTHOR   (普通变量)      要排除的 GitHub 用户名（多个逗号分隔，如站主自己），留空不过滤

export default {
  async fetch(request, env) {
    try {
      // 仅接受 POST（GitHub Webhook 只发 POST）
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 })
      }

      const rawBody = await request.text()
      const sig = request.headers.get('x-hub-signature-256')
      const event = request.headers.get('x-github-event')

      // 1) 验签：防止任何人伪造 POST 触发飞书消息
      if (!(await verifySignature(rawBody, sig, env.GH_SECRET))) {
        return new Response('Invalid signature', { status: 401 })
      }

      let payload
      try {
        payload = JSON.parse(rawBody)
      } catch {
        return new Response('Invalid JSON', { status: 400 })
      }

      // 2) 组装飞书文本（按事件类型）
      const text = buildFeishuText(event, payload, env)
      if (!text) {
        // 非目标事件（如 edited / deleted）忽略
        return new Response('Ignored', { status: 200 })
      }

      // 3) 推送飞书（飞书 webhook 已开放 CORS，直接 fetch）
      try {
        await fetch(env.FEISHU_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ msg_type: 'text', content: { text } })
        })
      } catch (e) {
        return new Response('Feishu push failed', { status: 502 })
      }

      return new Response('OK', { status: 200 })
    } catch (err) {
      // 兜底捕获：返回具体错误，方便在 GitHub Recent Deliveries 中排查
      console.error('[Worker Error]', err)
      return new Response('Internal error: ' + err.message, { status: 500 })
    }
  }
}

// HMAC-SHA256 验签：比对 GitHub 头里的签名与本地计算值
async function verifySignature(body, sigHeader, secret) {
  if (!sigHeader || !secret) return false
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const hex = [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const expected = 'sha256=' + hex

  const sigBytes = encoder.encode(sigHeader)
  const expBytes = encoder.encode(expected)
  if (sigBytes.length !== expBytes.length) return false
  return crypto.subtle.timingSafeEqual(sigBytes, expBytes)
}

// 解析站点展示名：支持只填域名，也支持填完整 URL（自动取 hostname）
function parseSiteName(raw) {
  const fallback = 'devnote.site'
  if (!raw) return fallback
  try {
    const url = new URL(raw)
    return url.hostname || fallback
  } catch {
    return raw
  }
}

// 按事件类型生成飞书文本；返回 null 表示忽略该事件
function buildFeishuText(event, p, env) {
  const site = parseSiteName(env.SITE_NAME)
  const ignore = (env.IGNORE_AUTHOR || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  // —— 新评论 / 嵌套回复 ——
  // GitHub Webhook 字段名是 p.comment，不是 p.discussion_comment
  if (event === 'discussion_comment' && p.action === 'created') {
    const c = p.comment
    const author = c?.user?.login || '匿名用户'
    if (ignore.includes(author)) return null
    const bodyText = (c?.body || '').replace(/\s+/g, ' ').trim()
    const url = c?.html_url || p.discussion?.html_url || ''
    const isReply = !!c?.parent_id // 有 parent_id 即嵌套回复
    const title = isReply
      ? '网站' + site + ' 收到新回复'
      : '网站' + site + ' 收到新评论'
    return [
      title,
      '用户：' + author,
      '内容：' + (bodyText.length > 200 ? bodyText.slice(0, 200) + '…' : bodyText),
      url
    ]
      .filter(Boolean)
      .join('\n')
  }

  return null
}
