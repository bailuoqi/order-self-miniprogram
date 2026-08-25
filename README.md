# 定制接单 — 软件定制 / 电子代做 团队接单系统

> 单一团队接单模式：客户下单 → 团队报价 → 确认报价 → 支付定金开工 → 交付成果 → 支付尾款 → 客户评价

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Vue3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js)](https://vuejs.org)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs)](https://nestjs.com)
[![uni-app](https://img.shields.io/badge/uni--app-3.x-2B9939)](https://uniapp.dcloud.net.cn)

## 产品定位

我们是一个专注「软件定制开发」与「电子产品代做」的工作室团队：

- **软件定制**：小程序开发、网站开发、脚本/工具、接口对接、系统二次开发
- **电子代做**：PCB 打样、焊接组装、单片机开发、电路设计、样机打样

小程序端只面向**客户**；团队成员在管理后台处理订单（报价、制作、交付）。没有抢单、任务池、师傅入驻、保证金等撮合平台逻辑。

## 核心功能

- **两种下单方式** — 标准服务下单（选服务提需求）/ 发布自定义需求
- **报价商议** — 团队后台报价（总价/定金/尾款/工期/交付说明），客户小程序确认，支持多轮报价与订单内聊天商议
- **两段支付** — 定金（确认报价后）+ 尾款（交付后），微信支付；开发环境提供模拟支付
- **交付管理** — 后台上传交付说明/文件/快递单号，客户查看确认
- **评价体系** — 尾款付清后客户评分评价，首页/服务详情展示精选评价
- **加入我们** — 客户可提交入伙申请，管理员后台审核
- **订单内 IM** — 每个订单一个客户↔团队会话
- **退款审核** — 付定金后可申请退款，管理员审核
- **可视化后台** — 拖拽式页面装修编辑器、CMS 公告

## 快速开始（本地开发）

### 环境要求
- Node.js 18+（开发环境用 SQLite，无需 MySQL）

### 1. 后端（端口 3001）

```bash
cd server
npm install
npm run dev            # 启动开发服务（自动建表，初始化 admin 账号）
npx ts-node src/seed.ts  # 首次运行：播种分类/标准服务/公告数据
```

### 2. 管理后台（端口 5173）

```bash
cd admin
npm install
npm run dev
```

| 项目 | 详情 |
|------|------|
| 地址 | http://localhost:5173/login |
| 账号 | admin |
| 密码 | admin123 |

### 3. 小程序

```bash
cd mini-program
npm install
npm run dev:h5         # H5 预览（端口 8081，自动开发登录）
npm run dev:mp-weixin  # 微信小程序（用微信开发者工具导入 dist/dev/mp-weixin）
```

H5 预览环境会自动调用 `/api/auth/dev-login` 创建体验客户（该接口生产环境禁用）；支付页提供「模拟支付」按钮走通全流程。

## 订单流程（唯一流程）

```
客户下单(标准服务/自定义需求)
  → pending_quote 待报价
  → quoting 报价商议中（团队报价，可多轮，订单内聊天）
  → confirmed 已确认待付定金（客户确认报价）
  → deposit_paid 制作中（定金到账开工）
  → delivered 已交付待尾款（团队上传成果）
  → final_paid 尾款已付（客户确认支付尾款）
  → completed 已完成（客户评价后）

任何付定金前可取消 → cancelled
付款后可申请退款 → refunding → refunded / 驳回恢复原状态
```

价格单位统一为**分**，前端展示转换为元。

## 技术架构

| 模块 | 技术栈 | 说明 |
|------|--------|------|
| 小程序前端 | uni-app (Vue3) + Pinia | 一套代码多端运行 |
| 管理后台 | Vue3 + Vite + Pinia | 现代化 SPA |
| 后端服务 | NestJS 10.x + TypeORM | 开发 SQLite / 生产 MySQL |
| 认证 | JWT + 微信登录 | 客户端；后台账号密码登录 |
| 支付 | 微信支付 JSAPI | 定金/尾款两段支付 + 回调验签；开发环境模拟支付 |

## 项目结构

```
├── mini-program/            # uni-app 小程序（仅客户角色）
│   ├── pages/               # 主包（首页/消息/订单/我的）
│   ├── subpkg/              # 分包
│   │   ├── order/           # 下单/发布需求/详情/支付/评价
│   │   ├── chat/            # 订单会话聊天
│   │   ├── product/         # 标准服务列表/详情
│   │   └── my/              # 加入我们/退款/设置/关于
│   ├── store/               # Pinia（auth/order/chat/product/category）
│   └── api/                 # 请求封装（BASE_URL: localhost:3001/api）
├── admin/                   # Vue3 团队后台
│   └── src/views/           # 工作台/订单中心/消息中心/纳新申请/团队成员...
├── server/                  # NestJS 后端
│   └── src/modules/
│       ├── order/           # 订单 + 报价记录（状态机核心）
│       ├── payment/         # 定金/尾款支付 + mock 支付
│       ├── chat/            # 订单绑定会话
│       ├── recruit/         # 「加入我们」纳新申请
│       ├── refund/          # 退款
│       └── ...              # auth/user/category/product/cms/page-config
└── docker-compose.yml       # 生产部署编排
```

## 微信小程序部署

1. 登录 [微信公众平台](https://mp.weixin.qq.com)，配置服务器域名
2. `server/.env.prod` 配置 `WX_APPID` / `WX_SECRET` / 商户号（勿提交敏感信息）
3. `npm run build:mp-weixin`，微信开发者工具打开 `mini-program/dist/build/mp-weixin/`
4. 上传代码并提交审核

## License

MIT (c) 2026 定制接单工作室
