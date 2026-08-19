// ===== 数据：工具箱分类与工具数据 =====
// 工具数据：按分类分组展示（网络 / 工具 / AI / API）
// 每个分类独立使用 useMasonry 瀑布流布局
// 引入站点作者名，供示例文案中派生 GitHub 用户名占位
import { author } from './site.js'

export const toolCategories = [
  {
    key: 'network',
    title: '网络类',
    color: '#34c759',
    desc: '网络接入与合规访问工具，仅供个人技术学习、学术查阅使用。',
    tools: [
      {
        key: 'vpn',
        name: '⭐️ 科学上网VPN（合规学习用途）',
        shortName: '科学上网',
        desc: '本板块仅分享用于查阅海外 AI 官方文档、技术资料的合规网络工具，仅供个人技术学习、学术查阅使用，请严格遵守国家《网络安全法》及相关法律法规，合法合规使用网络资源。',
        features: ['海外文档访问', '技术资料查阅', '学术研究'],
        steps: [],
        example: '',
        exampleDesc: '',
        link: 'https://go.huajic.com/?path=auth/register&code=d39H',
        linkText: '前往官网'
      }
    ]
  },
  {
    key: 'tool',
    title: '工具类',
    color: '#0071e3',
    desc: '日常开发与效率小工具，全部在浏览器本地完成，数据不上传。',
    tools: [
      {
        key: 'json-viewer',
        name: 'JSON 格式化查看器',
        shortName: 'JSON格式化',
        desc: '在线 JSON 格式化与查看工具：粘贴 JSON 文本，一键美化缩进、压缩体积，语法高亮清晰展示键、字符串、数字与布尔值，支持一键复制结果。适合调试接口返回、整理配置文件、快速阅读 JSON 数据。',
        features: ['一键格式化', '压缩去空格', '语法高亮', '一键复制'],
        steps: [],
        example: '',
        exampleDesc: '',
        page: 'jsonviewer',
        linkText: '打开工具'
      },
      {
        key: 'file-diff',
        name: '文件对比工具',
        shortName: '文件对比',
        desc: '在线文件差异对比工具：支持左右分屏粘贴或打开任意文本文件（日志、代码、配置、JSON 等），实时高亮新增与删除内容，拖动分隔条自由调节两侧区域（移动端上下分屏），可一键互换两侧、载入示例快速体验、一键清空重来；内容为 JSON 时自动格式化后再对比，让差异一目了然。',
        features: ['打开文件', '实时差异高亮', '左右/上下分屏拖拽', '一键互换', '载入示例', '清空重来', 'JSON 自动格式化对比'],
        steps: [],
        example: '',
        exampleDesc: '',
        page: 'filediff',
        linkText: '打开工具'
      },
      {
        key: 'url-codec',
        name: 'URL 在线转码/解码',
        shortName: 'URL编解码',
        desc: '在线 URL 编码/解码工具：输入 URL 或普通文本，一键进行 encodeURIComponent 转码或 decodeURIComponent 解码，结果支持一键复制，并内置示例快速体验。适合接口调试、URL 参数处理、中文链接编码等场景。',
        features: ['URL 转码', 'URL 解码', '一键复制结果', '载入示例'],
        steps: [],
        example: '',
        exampleDesc: '',
        page: 'urlcodec',
        linkText: '打开工具'
      },
      {
        key: 'image-base64',
        name: '图片转 Base64 编码',
        shortName: '图片Base64',
        desc: '本地图片转 Base64 编码工具：支持点击上传或拖拽上传图片，上传后自动转换为 data URI 格式的 Base64 字符串，一键复制结果；支持输入输出互换，将 Base64 还原为图片预览。所有转换均在浏览器本地完成，不上传服务器。',
        features: ['图片转 Base64', '拖拽上传', '自动转换', '输入输出互换', '一键复制结果'],
        steps: [],
        example: '',
        exampleDesc: '',
        page: 'imagebase64',
        linkText: '打开工具'
      },
      {
        key: 'color-converter',
        name: 'RGB/Hex 颜色转换工具',
        shortName: '颜色转换',
        desc: 'RGB 与 Hex 颜色值互转工具：支持 RGB 三个通道输入自动转换为十六进制颜色码，也支持十六进制颜色码一键解析为 RGB；实时预览色块、一键复制结果、输入输出互换。适合前端开发、设计稿取色等场景。',
        features: ['RGB 转 Hex', 'Hex 转 RGB', '实时预览', '输入输出互换', '一键复制结果'],
        steps: [],
        example: '',
        exampleDesc: '',
        page: 'colorconverter',
        linkText: '打开工具'
      },
      {
        key: 'base64-codec',
        name: 'BASE64 加密/解密',
        shortName: 'Base64加/解',
        desc: '支持 UTF-8 与 GBK 字符编码的 Base64 加密、解密工具，输入文本或 Base64 字符串后一键提交，结果可复制，支持输入输出互换。适合接口调试、编码转换、中文 GBK 编解码等场景。',
        features: ['加密 / 解密切换', 'UTF-8 与 GBK 编码', '输入输出互换', '一键复制结果'],
        steps: [],
        example: '',
        exampleDesc: '',
        page: 'base64codec',
        linkText: '打开工具'
      },
      {
        key: 'md5-hash',
        name: 'MD5 加密',
        shortName: 'MD5加密',
        desc: '在线 MD5 加密工具：输入任意文本即可计算 32 位小写 MD5 哈希值，结果支持一键复制。适合接口签名生成、数据校验、密码摘要等场景。',
        features: ['在线 MD5 加密', '32 位小写结果', '一键复制结果', '本地计算不上传'],
        steps: [],
        example: '',
        exampleDesc: '',
        page: 'md5hash',
        linkText: '打开工具'
      },
      {
        key: 'password-generator',
        name: '随机密码生成器',
        shortName: '随机密码',
        desc: '安全随机密码生成工具：自由组合大写字母、小写字母、数字与特殊字符，自定义密码长度，使用浏览器原生加密随机数生成高强度密码，一键复制使用。适合账号注册、密钥创建、安全凭证生成等场景。',
        features: ['自定义字符集', '自定义长度', '加密随机数', '一键复制'],
        steps: [],
        example: '',
        exampleDesc: '',
        page: 'pwdgenerator',
        linkText: '打开工具'
      }
    ]
  },
  {
    key: 'ai',
    title: 'AI类',
    color: '#af52de',
    desc: 'AI 智能体搭建与本地大模型运行。',
    tools: [
      {
        key: 'openclaw',
        name: 'OpenClaw智能体',
        shortName: 'OpenClaw',
        desc: 'OpenClaw（龙虾智能体）是一款轻量化、低代码 AI 多智能体框架，主打高效自动化工作流搭建，支持插件拓展、知识库对接、多渠道部署，无需深厚编程基础，即可搭建专属办公自动化、数据处理、智能问答 AI 应用。',
        features: ['低代码搭建', '多智能体协作', '插件拓展', '知识库对接', '多渠道部署'],
        steps: [],
        example: '',
        exampleDesc: '',
        link: 'https://docs.openclaw.ai/zh-CN',
        linkText: '前往官网'
      },
      {
        key: 'wordbuddy',
        name: '⭐️ WorkBuddy自动化 AI 办公助手',
        shortName: 'WorkBuddy',
        desc: 'WorkBuddy 是腾讯云推出的轻量化全场景 AI 办公智能工作台，网页免安装、桌面端本地运行双模式，主打替用户执行电脑实操任务。覆盖文档处理、数据分析、代码开发、创意设计，内置标准化技能包与软件连接器，支持定时自动化、微信远程操控，本地运算保障数据隐私，面向企业员工与个体创业者，开箱即用，降低办公重复劳动成本。',
        features: ['文档总结改写', '表格数据分析', '自动生成办公文案', '文件批量处理', '智能纠错', '内容优化'],
        steps: [],
        example: '',
        exampleDesc: '',
        link: 'https://www.codebuddy.cn/docs/workbuddy/Overview',
        linkText: '前往官网'
      },
      {
        key: 'coze',
        name: 'Coze零代码搭建 AI 智能体',
        shortName: 'Coze',
        desc: '扣子 Coze 是字节跳动推出、开源可商用的零代码 AI 智能体开发平台，无需编程，可视化拖拽即可搭建专属 Bot 与自动化工作流。内置丰富插件、私有知识库与多智能体协同能力，可搭建客服、办公助手、数据处理机器人，支持一键发布至豆包、飞书、抖音等渠道，适配个人、团队批量搭建复用 AI 工具，适合打造长期业务自动化流程。',
        features: ['自定义智能体Bot搭建', '可视化工作流', '丰富插件市场', ' 多模型自由切换', '一键多渠道部署'],
        steps: [],
        example: '',
        exampleDesc: '',
        link: 'https://www.coze.cn',
        linkText: '前往官网'
      },
      {
        key: 'ollama',
        name: 'Ollama 本地大模型运行',
        shortName: 'Ollama',
        desc: 'Ollama 是一款开源免费的本地大语言模型运行框架，支持 macOS、Linux、Windows，一键拉取并运行 Llama、Mistral、Qwen 等主流开源模型。可在本地离线对话、构建私有 AI 智能体，数据不出本机，保障隐私安全，是开发者本地调试、搭建私有化 AI 应用的首选工具。',
        features: ['本地部署', '多模型支持', '跨平台', '开源免费'],
        steps: [],
        example: '',
        exampleDesc: '',
        link: 'https://ollama.com/',
        linkText: '前往官网'
      }
    ]
  },
  {
    key: 'api',
    title: 'API类',
    color: '#ff9500',
    desc: '免费开放的 API 接口资源，即取即用。',
    tools: [
      {
        key: 'deepseek',
        name: 'DeepSeek API 开放平台',
        shortName: 'DeepSeek',
        desc: 'DeepSeek（深度求索）开放平台提供高性价比的大模型 API 服务，支持 DeepSeek-V3 通用对话模型与 DeepSeek-R1 深度推理模型，兼容 OpenAI 接口协议，开发者可一键迁移接入。适合智能体、代码助手、数据分析等 AI 应用，以更低成本获得顶尖的中文与推理能力。',
        features: ['高性价比', 'OpenAI 兼容', '中文能力强'],
        steps: [],
        example: '',
        exampleDesc: '',
        link: 'https://platform.deepseek.com/',
        linkText: '前往官网'
      },
      {
        key: 'github-user-search',
        name: 'GitHub 用户搜索 API',
        shortName: 'GitHub搜索',
        desc: 'GitHub 官方提供的用户搜索接口，在链接末尾拼接 GitHub 用户名即可查询该用户的基本信息、仓库数、粉丝数等公开资料，返回标准 JSON。适合做开发者主页检索、贡献者查证、技术社区用户分析，或接入智能体实现「查一下某个 GitHub 用户」的对话能力。',
        features: ['官方接口', '用户名检索', 'JSON 返回', '免费调用'],
        steps: [],
        example: `例如：https://api.github.com/search/users?q=${author}`,
        exampleDesc: `将链接末尾的 ${author} 替换为任意 GitHub 用户名即可查询`,
        link: 'https://api.github.com/search/users?q=',
        linkText: '查看接口'
      },
      {
        key: 'hitokoto-api',
        name: '每日一言 API',
        shortName: '每日一言',
        desc: '免费开放的每日一句接口，随机返回一句励志、文艺或经典的语录，内容简洁、即取即用，无需任何参数。适合作为个人博客座右铭、项目启动页文案，或为 AI 聊天机器人、智能体提供每日问候素材，让页面更有温度。',
        features: ['随机语录', 'JSON 接口', '免费调用'],
        steps: [],
        example: '',
        exampleDesc: '',
        link: 'https://api.xygeng.cn/one',
        linkText: '查看接口'
      },
      {
        key: 'hitokoto-cn',
        name: 'Hitokoto 一言 API',
        shortName: 'Hitokoto',
        desc: '基于 Hitokoto 社区的海量句子库，内容来自网络真实用户的投稿与评论，随机返回来自动漫、游戏、小说、网络或原创的精选语句，支持通过 ?c= 参数按类型（如动画、游戏、诗词）筛选，并附带句子来源与作者信息。适合做语录墙、随机签名、内容创作灵感库，或接入智能体按主题调取特定风格的文案。',
        features: ['随机句子', '多类型筛选', 'JSON 接口', '免费调用'],
        steps: [],
        example: '',
        exampleDesc: '',
        link: 'https://v1.hitokoto.cn/',
        linkText: '查看接口'
      },
      {
        key: 'cat-api',
        name: '随机猫咪图片 API',
        shortName: '随机猫图',
        desc: '免费可爱的随机猫咪图片接口，每次请求返回不同的高清猫咪照片。适合用于网页占位图、加载动画、聊天机器人表情包，或作为开发调试时的轻松素材，为项目和团队氛围增添一份趣味。',
        features: ['随机猫图', '高清图片', 'JSON 接口', '免费调用'],
        steps: [],
        example: '',
        exampleDesc: '',
        link: 'https://api.thecatapi.com/v1/images/search',
        linkText: '查看接口'
      },
      {
        key: 'dog-api',
        name: '随机狗狗图片 API',
        shortName: '随机狗图',
        desc: '免费开放的狗狗图片接口，每次请求随机返回不同品种狗狗的高清照片，数据源自公开的犬种图库。适合用于网页占位图、加载动画、聊天机器人表情包，或与猫咪接口搭配做成趣味图集，为项目增添轻松可爱的氛围。',
        features: ['随机狗图', '多品种', 'JSON 接口', '免费调用'],
        steps: [],
        example: '',
        exampleDesc: '',
        link: 'https://dog.ceo/api/breeds/image/random',
        linkText: '查看接口'
      }
    ]
  }
]

// 展平的扁平数组（兼容旧引用）
export const tools = toolCategories.flatMap((c) => c.tools)
