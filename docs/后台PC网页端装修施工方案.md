# 后台 PC 网页端装修施工方案

二期（C1–C4，PR #20–#23）已合入 master：装修器「后台编辑 → 发布 → 客户端手机首页生效」闭环完成。但装修器只有手机画布（375 宽 phone 框架），客户端 H5 在电脑浏览器（≥768px）下只是把**手机版配置**限宽 1200 居中做响应式放大——运营无法针对电脑网页版换素材、改排版、调列数。本期为装修器增加「电脑版」编辑能力：**同一个编辑器内设备切换（手机 / 电脑），电脑版配置独立存 `home-pc` / `home-pc-draft` 双 key，操作方式（三栏、拖拽、属性面板、草稿/发布/历史）与现有完全一致**。全部工作拆成 **4 个文件互不重叠的并行工作流（P1–P4）**。

---

## 1. 策略结论

- **采用「双 key 独立配置」而非「统一配置加断点」。** 电脑版配置存 `page-config/home-pc`（草稿 `home-pc-draft`），与手机版 `home` / `home-draft` 完全平行。理由：
  1. **服务端零改动**——`POST /:key/publish`、`GET /:key/revisions`、`POST /:key/rollback`、`GET /:key/meta`、体积护栏、每 key 20 条历史裁剪全部是 key 泛型实现，`home-pc` 开箱即用；
  2. **双端互不破坏是结构性保证**——发布电脑版只写 `home-pc` 行，手机版数据与渲染物理隔离，验收「互不破坏」不依赖代码纪律；
  3. 统一配置加断点（如 `components[].pcProps` 或 schemaVersion:2）会击穿客户端既有合法性判定（`isValidPageConfig` 要求 `schemaVersion === 1`），旧客户端直接兜底黑屏配置区，且编辑器撤销栈/脏标记要同时管两套 props，复杂度与回归面远大于收益。
- **编辑器内设备切换，不新建独立编辑器页面。** `PageBuilder.vue` 工具栏加「手机 / 电脑」设备页签，切换时整体换编辑上下文（components、global、撤销栈、脏标记、草稿状态各一套）；组件库、拖拽、属性面板、保存/发布/历史操作方式不变。这与主流装修工具（有赞微页面等）的设备页签一致，满足「操作方式与现在相近」。
- **schema 复用 `schemaVersion:1`，组件子集与手机版相同的 10 类。** 电脑版不引入新组件类型，只改**渲染语义**：props 中 px 在电脑版按 CSS px 直读（手机版是 px→rpx×2），栅格列数上限放宽，默认值按桌面尺度。客户端校验、归一化、图标白名单、链接解析纯函数全部复用。
- **客户端消费断点定为 ≥768px，与现有桌面适配完全对齐。** topWindow 顶栏、tabBar 隐藏、内容限宽 1200 都在 768 切换，电脑版配置必须在同一断点切换，避免「桌面 chrome + 手机内容」或反之的混搭。回退链：`home-pc` 合法 → 电脑版渲染器；否则 `home` 合法 → 现状（手机配置响应式）；否则 → 硬编码兜底。**未发布电脑版配置时，桌面行为与现状逐像素一致**，天然向后兼容。
- **服务端本期仅做一项可选护栏**（P4，非功能阻塞）：公开 `GET /page-config/:key` 目前对任意未知 key 自动落库建 `{}` 行，匿名请求可无限造行；改为仅白名单/已存在 key 自动初始化，响应形状不变。

## 2. 现状与差距

| # | 现状 | 证据 | 差距 |
|---|---|---|---|
| G1 | 装修器只有手机画布：391px phone 框架、tabBar 示意、fit 缩放按手机高度算 | `PageBuilder.vue` `.phone` 结构、`phoneSize {w:391,h:700}` | 无电脑画布、无设备切换、无 1366/1920 视口 |
| G2 | 客户端桌面（≥768）渲染的是**手机版配置**：`config-blocks.vue` 用 rpx（≥768 锁 375 基准即 px×2 固定尺寸），仅靠 `#ifdef H5` 媒体查询把 goodsRow 转 4 列 | `config-blocks.vue` U4 段、`pages.json` `rpxCalcMaxDeviceWidth:767` | 桌面无法独立换素材/排版；手机版 banner 拉到 1200 宽画质与构图不适配 |
| G3 | 编辑/发布链路（草稿、发布、历史、回滚、meta、体积护栏）全部 key 泛型 | `page-config.controller.ts` / `service.ts` 全部 `:pageKey` 参数化；`RevisionDrawer.vue` 已收 `page-key` prop | 无差距——这是本方案「服务端零改动」的基础 |
| G4 | 属性面板、组件默认值、模板均按手机尺度（banner 高 160px、goodsRow 2 列等） | `PageBuilder.vue` baseComps/templates、`PropsEditor.vue` 各类型区间 | 电脑版需要桌面尺度默认值、更宽列数区间与差异提示 |
| G5 | 公开 GET 未知 key 自动建行 | `page-config.service.ts` `getConfig()` 无 key 白名单 | 匿名写放大面（P4 护栏，顺带修） |

## 3. 信息架构（编辑器）

- **设备页签**：工具栏左区（「首页」页签旁）加「手机 / 电脑」切换。页签各自带「草稿未发布」「未保存」徽标；切换设备**不丢失**另一端未保存修改（两套上下文常驻内存），Ctrl+S / 保存 / 发布只作用于当前设备。
- **电脑画布**：浏览器窗口拟物框（顶部圆点 + 地址栏示意）替代 phone 框架；框内顶部固定一条 **topWindow 顶栏示意**（品牌 + 首页/服务分类/标准服务/发布需求/我的订单/消息，仅展示不可编辑，与 `windows/top-window.vue` 对齐）；下方为页面区：背景色吃 `global.bgColor` 铺满，**内容列 1200px 居中**，组件拖入内容列纵向排列。无 tabBar 示意。
- **画布视口**：宽度切换 **1366 / 1920**（默认 1366）。版式以 1200 内容列为准，1366/1920 只改变视口宽度用于核对背景铺满与留白效果；既有缩放组（75/100/125/适应）沿用，「适应」在电脑画布按宽高双向取 min。
- **预览方式**：编辑器内「预览」模式渲染当前设备的整页效果（电脑版 = 浏览器框 + 顶栏 + 配置区块）；发布/草稿的**真实预览**沿用客户端 H5 `/#/?preview=draft`——同一地址在 ≥768 宽窗口打开读 `home-pc-draft`、手机宽度读 `home-draft`（发布成功弹窗按当前设备给出对应提示文案）。
- **空画布引导**：电脑版首次进入（`home-pc` 尚无配置）时空态提示「电脑端尚未装修，发布前客户端桌面将继续按手机版配置响应式渲染」，并提供「导入手机版布局」按钮：把手机版当前画布组件深拷贝为电脑版起点（props 原样，运营再按桌面尺度调整）。
- **组件库**：与手机版同一面板、同 10 类子集；「客户端不渲染」（articleList/videoPlayer/floatingBtn）与「已停用」（营销四件）标注体系原样沿用，两端语义一致。

## 4. schema 与 page-config key 设计（本章为唯一权威契约）

### 4.1 key 矩阵

| 端 | 线上 key | 草稿 key | 发布端点 | 历史/回滚/meta |
|---|---|---|---|---|
| 手机（现状不动） | `home` | `home-draft` | `POST /page-config/home/publish` | `/page-config/home/...` |
| 电脑（本期新增） | `home-pc` | `home-pc-draft` | `POST /page-config/home-pc/publish` | `/page-config/home-pc/...` |

服务端草稿 key 约定为 `${key}-draft`（`publish()` 现实现），`home-pc` 的草稿因此固定为 `home-pc-draft`。两组 key 的 revisions、rollback、20 条裁剪、200KB 护栏互相独立。

### 4.2 顶层形状（电脑版）

```json
{
  "schemaVersion": 1,
  "components": [ { "_id": "c_xxx", "type": "banner", "props": { } } ],
  "global": { "pageTitle": "首页", "bgColor": "#f5f6fa", "shareTitle": "", "shareImage": "" }
}
```

与手机版同形状、同校验（客户端 `sniffPageConfig` / `isValidPageConfig` / `normalizePageConfig` 直接复用）。电脑版 global **不写入** `navStyle/navBgColor/navTextColor/showTabbar/tabItems`（桌面导航由 topWindow 固定承担）；即便存量数据带这些字段，电脑版渲染端一律不消费。

### 4.3 组件电脑版子集：默认值与版式规则

同 10 类，props 字段不增不减；下表规定**拖入电脑画布时的默认值**与**电脑版渲染规则**（P1 编辑器默认值、P2 面板区间、P3 客户端渲染器三方均以本表为准，各自内联常量，不跨流共享代码）：

| type | 电脑版默认 props（与手机版差异项） | 电脑版版式规则 | 消费差异 |
|---|---|---|---|
| banner | `height: 320`、`radius: 12` | 内容列内通栏（1200 宽）swiper，高度 px 直读 | 建议横向宽图；其余同手机 |
| search | `radius: 22` | 居中展示，最大宽 560px，点击进分类检索 | `hotWords` 不消费（同手机） |
| notice | 同手机 | 通栏单行省略条 | `speed` 不消费 |
| navGrid | `columns: 8`、`gutter: 12` | 每行 `columns` 个（区间见 4.5），图标卡片 56px | 图标白名单同二期 5.4 |
| titleBar | 同手机 | 标题 20px/更多右置；`align:center` 居中 | — |
| imageAd | `height: 200`、`radius: 12` | 通栏图，高度 px 直读 | `width` 不消费（恒 100%） |
| goodsRow | `layout: 'grid'`、`columns: 4` | grid：`repeat(columns, minmax(0,1fr))`；scroll：横滚卡片固定宽 280px | price 分→元同手机；点击进详情 |
| richText | `padding: 16` | 白底卡片通栏，H5 用 v-html | 同手机 |
| divider | 同手机 | px 直读 | 恒渲染 |
| blank | `height: 24` | px 直读 | 恒渲染 |

**统一规则**：未知/子集外 type 静默跳过（营销四件、articleList/videoPlayer/floatingBtn 同手机端处理）；空值跳过规则与二期 5.2 完全一致；链接解析复用 `resolveLink`（二期 5.3）；图标白名单复用二期 5.4。

### 4.4 global（电脑版）消费

| 字段 | 编辑器 | 客户端（H5 ≥768） |
|---|---|---|
| `pageTitle` | 全局设置面板保留 | `uni.setNavigationBarTitle`（H5 即 document.title） |
| `bgColor` | 保留 | 页面背景（铺满全宽） |
| `shareTitle` / `shareImage` | 保留 | 本期存储不消费（H5 分享场景后续用） |
| `navStyle/navBgColor/navTextColor/showTabbar/tabItems` | **面板隐藏**，注明「桌面导航/页脚由客户端顶栏固定，此处不可配置」 | 不消费 |

### 4.5 单位、断点与区间

- **单位**：电脑版配置中数值型 px 一律按 **CSS px 直读**（不做 rpx 换算）；手机版维持 px→rpx×2 不变。同名 props 在两个 key 中语义按各自设备解释——这是双 key 方案的一部分，写入本章即为契约。
- **断点**：客户端 ≥768px（`window.matchMedia('(min-width:768px)')`，与 topWindow / `$bp-tablet` 对齐）读电脑版配置；768–1199 档内容列随视口收缩（百分比栅格自适应，不得横向溢出），≥1200 满 1200 列宽。
- **面板区间（P2）**：navGrid `columns` 电脑版 4–10（手机 3–5）；goodsRow `columns` 电脑版 2–5（手机 2–3）；banner `height` 电脑版 120–600（手机 80–300）；imageAd `height` 电脑版 80–480。区间外输入按现有面板逻辑钳制。

## 5. 逐模块方案

### 5.1 编辑器壳与电脑画布（P1，`PageBuilder.vue` + 新建 `PcCompRenderer.vue`）

- **双上下文状态机**：`deviceCtx = { mobile: {...}, pc: {...} }`，每套含 `components/global/history/historyIdx/lastSavedStr/publishedStr/draftUnpublished/selIdx`；`device` ref 决定活动上下文，所有既有操作函数（拖拽、排序、增删改、撤销重做、模板、清空）改为作用于活动上下文——现有 drag/drop 处理器只操作 components 数组，天然设备无关，改造以「取活动数组」为主。
- **加载**：onMounted 并行拉四个 GET（`home-draft`/`home`/`home-pc-draft`/`home-pc`），各自三形状嗅探后初始化两套上下文与首帧快照；电脑版无合法配置时进空态引导（见第 3 章）。
- **保存/发布**：`saveDraft()`/`publishNow()` 参数化 pageKey（活动设备映射 `home`↔`home-pc`）；发布优先 `POST /page-config/{key}/publish`，404/失败回退双 PUT（沿用二期容错纪律）；发布确认与成功弹窗文案按设备区分（电脑版注明「≥768 宽窗口打开预览地址」）。离开拦截检查两端脏标记，「保存草稿并离开」保存所有脏设备。
- **电脑画布**：浏览器拟物框 + topWindow 示意 + 1200 内容列（结构详见第 3 章），组件渲染委托新建 `admin/src/components/builder/PcCompRenderer.vue`（props：`type/props/global/preview`，10 类桌面版式按 4.3 表实现，价格分→元、图标白名单回退复用 `client-icons.js` 既有常量）；选中框、组件操作条、拖放指示线、图层列表复用既有实现。
- **视口与缩放**：1366/1920 宽度切换 + 既有 zoom 组；fit 按画布面板宽高双向计算。
- **电脑版模板**：模板弹窗按设备出对应模板组；电脑版内置 2–3 套（默认桌面版式 / 极简通栏 / 品牌宽幅），组件默认值按 4.3。
- **信息条**：更新为双 key 说明（手机存 `home(-draft)`、电脑存 `home-pc(-draft)`，`?preview=draft` 按窗口宽度自动分流）。

### 5.2 属性面板与历史抽屉双端适配（P2，`PropsEditor.vue` + `RevisionDrawer.vue`）

- `PropsEditor` 新增可选 prop `device: 'mobile' | 'pc'`（默认 `'mobile'`，向后兼容）：按 4.5 切换数值区间与占位提示；电脑版隐藏无意义项（如 imageAd 已无 width，无需变化）并追加桌面提示文案（banner「桌面建议 1200×320 以上宽图」、goodsRow「桌面栅格 2–5 列」、navGrid「桌面每行 4–10 个」）。
- `RevisionDrawer` 已支持 `page-key` prop，功能对 `home-pc` 开箱即用；本流仅补展示区分：标题与提示按 key 显示「手机版 / 电脑版」字样，避免运营看错通道。
- **合并顺序安全**：P1 先合入时，`PropsEditor` 未声明 `device` prop 也不报错（落入 attrs），面板暂按手机区间工作；P2 先合入时 `device` 缺省 `'mobile'`，现状不变。两向均可独立构建验收。

### 5.3 发布 / 草稿 / 历史链路

复用二期 C2 通道，无新端点：电脑版发布写 `home-pc` + revision；历史抽屉传 `page-key="home-pc"`；回滚写回 `home-pc` 与 `home-pc-draft` 后重载电脑上下文并重打首帧快照。手机链路一行不改。

### 5.4 客户端消费（P3，`common/page-config.js` + `pages/index/index.vue` + 新建 `components/page-config/config-blocks-pc.vue`）

- **判定**：`common/page-config.js` 新增 `HOME_PC_CONFIG_CACHE_KEY = 'home_pc_page_config'` 与 `isDesktopViewport()`（内部 `typeof window` 守卫 + matchMedia，小程序端恒 false）；校验/归一化/链接/图标纯函数全部复用。
- **获取与回退链**（`pages/index/index.vue`，仅 H5 逻辑走 `#ifdef H5`）：
  1. 桌面视口（≥768）：拉 `home-pc`（草稿预览拉 `home-pc-draft`），合法 → `<config-blocks-pc>` 渲染，并写 PC 缓存首帧直出；
  2. `home-pc` 缺失/不合法 → 现状原样：`home` 合法走 `<config-blocks>` 响应式，否则硬编码兜底；
  3. 手机视口与小程序端：现有逻辑一字不动。
  `home` 请求保持现状始终发出（兜底数据源）；`home-pc` 请求仅桌面视口追加，两请求并行。视口跨 768 变化（拉伸窗口）通过 matchMedia change 监听切换渲染分支并懒拉缺失配置。
- **渲染器** `config-blocks-pc.vue`：10 类桌面版式按 4.3 表实现，尺寸一律 px；组件与 import 均包 `#ifdef H5`，不进小程序包；内容列限宽由页面既有 `content-limit(1200)` 承担，渲染器内部不再限宽；goodsRow scroll 布局沿用滚轮横滚事件委托模式。
- **草稿预览**：`/#/?preview=draft` 在桌面视口读 `home-pc-draft` 并显示既有「草稿预览」角标，不写缓存。
- **回归红线**：未发布 `home-pc` 时，桌面渲染路径与现状完全一致；mp-weixin 构建产物不含 PC 渲染器。

### 5.5 服务端护栏（P4，`server/src/modules/page-config/*`，非阻塞）

- `getConfig()`：仅当 key 在已知集合（`DEFAULT_CONFIGS` 各 key、`settings`、`home-pc` 及上述各 key 的 `-draft` 后缀）或行已存在时自动初始化落库；未知 key 返回 `{}` **但不建行**（响应形状不变，消灭匿名 GET 写放大）。
- `DEFAULT_CONFIGS` 增加 `"home-pc": {}` 显式登记（空对象即「无配置」，客户端按回退链处理）。
- 既有 GET/PUT/publish/revisions/rollback/meta 行为回归自验（home 与 home-pc 两组 key 各跑一遍发布→历史→回滚闭环）。

## 6. 改造清单（目录级）

| 端 | 动的文件 | 内容 |
|---|---|---|
| admin | `src/views/PageBuilder.vue` | 设备页签、双上下文、电脑画布、1366/1920 视口、电脑模板、发布链路参数化 |
| admin | 新建 `src/components/builder/PcCompRenderer.vue` | 10 类组件桌面版式渲染 |
| admin | `src/components/PropsEditor.vue`、`src/components/builder/RevisionDrawer.vue` | device 感知面板、历史抽屉端标注 |
| mini-program | `common/page-config.js`、`pages/index/index.vue`、新建 `components/page-config/config-blocks-pc.vue` | 桌面视口判定、home-pc 获取/缓存/回退链、桌面渲染器、草稿预览分流 |
| server | `src/modules/page-config/page-config.service.ts` | key 白名单护栏 + `home-pc` 登记（唯一服务端改动，非阻塞） |
| 不动 | `admin` 其余视图与 ui/*、`mini-program` 其余页面与 topWindow、`server` 其余模块、路由与 pages.json | — |

## 7. 验收标准

1. **电脑端编辑闭环（核心）**：电脑页签下拖入 banner（宽图）/navGrid/titleBar/goodsRow（真实服务）/notice → 保存草稿 → 发布 → 桌面浏览器 1366 与 1920 各验一遍：首页按配置顺序渲染，列数/文案/图片/价格（元）与画布一致，链接可跳转。
2. **双端互不破坏**：发布电脑版前后，手机 H5（375）与小程序首页渲染逐项不变；`home` 行数据不变；反向（发布手机版）同理；两 key 历史/回滚互不影响。
3. **回退链**：`home-pc` 未发布/为空/接口失败时，桌面首页与现状（手机配置响应式或硬编码兜底）逐像素一致，控制台无未捕获错误。
4. **断点与流体**：≥768 读电脑配置；768–1199 无横向溢出、栅格自适应收缩；跨 768 拉伸窗口渲染分支正确切换。
5. **草稿预览**：桌面宽窗口 `/#/?preview=draft` 显示 `home-pc-draft` 内容并带角标、不写缓存；手机宽度同地址仍显示 `home-draft`。
6. **编辑器一致性与可用性**：设备切换不丢任一端未保存修改；撤销/重做/图层/模板/清空/快捷键在电脑模式全部可用；1366/1920 切换与缩放正常；「导入手机版布局」可用；发布成功弹窗按设备给出正确预览指引。
7. **服务端（P4）**：未知 key 公开 GET 不再落库；白名单 key 与既有行为回归不变；home 与 home-pc 双通道 publish/revisions/rollback 闭环各自可用。
8. **工程**：`admin`、`server` 构建通过；`mini-program` H5 与 mp-weixin 构建通过，小程序包无 PC 渲染器代码；PC 逻辑均在 `#ifdef H5` 内。

## 8. 分期

- **一期（本方案，P1–P4）**：首页电脑版最小可用闭环——设备切换编辑、双 key 草稿/发布/历史、客户端 ≥768 消费与回退链、服务端护栏。
- **二期候选**：电脑版专属组件（多栏行容器、宽幅 hero、页脚编辑）；topWindow 导航项可配置化；分类页/我的页等其他页面双端装修；发布前双端 diff 预览；并发编辑乐观锁（meta 数据面已备）。

## 9. 风险

| 风险 | 影响 | 缓解 |
|---|---|---|
| 双上下文状态机引入回归（切换丢历史/脏标记串端） | 编辑器可靠性 | 上下文整体对象化、按 device 索引，禁止散装 ref；验收第 6 条全项走查 |
| 两端 px 语义不同（手机 ×2 rpx、电脑直读）被误用 | 渲染尺寸错位 | 语义写入 4.5 契约；「导入手机版布局」提示导入后需按桌面尺度复核 |
| 768–1199 档电脑版式溢出 | 平板/半屏观感 | 4.3 规定百分比栅格与 minmax；验收第 4 条专项覆盖 |
| PC 渲染器误入小程序包 / 裸用 DOM API | mp-weixin 构建失败或包体积 | import 与使用均 `#ifdef H5`；验收第 8 条含双端构建 |
| P1/P2 合并顺序导致面板降级 | 短暂功能缺失 | `device` 可选 prop 双向兼容（5.2）；任意顺序可构建可验收 |
| 运营在电脑端误发手机内容（导入后未调整） | 观感 | 空态引导明示回退机制；导入按钮附提示；画布默认值即桌面尺度 |
| `home-pc` 公开 GET 暴露草稿 | 信息面 | 与 `home-draft` 同级公开（二期已接受的暴露面），无新增敏感数据 |

## 10. 给开发 AI 的任务拆条（4 个并行工作流）

**通用纪律**：只改本流「文件所有权」列出的文件；不跨流 import 对方**新建**的组件；新增依赖为零；对未合入的兄弟流一律容错降级（可选 prop 缺省、回退链、404 回退）；schema、key、默认值、区间一切以本文档第 4 章为准（各流内联常量，不共享代码）；交付前本流构建通过（admin→`npm run build`；server→`npm run build`；mini-program→H5 与 mp-weixin 构建）并按第 7 章对应条目自验；分支独立开 PR。

### P1 编辑器双端切换与电脑画布（admin）
**文件所有权**：`admin/src/views/PageBuilder.vue`、新建 `admin/src/components/builder/PcCompRenderer.vue`

- **T1 双上下文状态机**：mobile/pc 两套 `{components, global, history, historyIdx, lastSavedStr, publishedStr, draftUnpublished, selIdx}`；设备页签切换；徽标、脏标记、离开拦截（检查两端、保存所有脏设备）按设备生效；快捷键作用于活动设备。
- **T2 加载与发布链路参数化**：onMounted 并行拉 `home-draft/home/home-pc-draft/home-pc` 四 GET 初始化双上下文；saveDraft/publish 按活动设备映射 key；发布优先 publish 端点、404 回退双 PUT；发布确认/成功弹窗与信息条文案按设备区分；RevisionDrawer 传动态 `page-key`，回滚后仅重载对应上下文。
- **T3 电脑画布**：浏览器拟物框 + topWindow 示意（品牌+六导航，静态）+ `global.bgColor` 铺满 + 1200 内容列；复用既有拖放/排序/选中/操作条/指示线逻辑；1366/1920 视口切换；fit 缩放按宽高双向计算；预览模式电脑版整页渲染。
- **T4 PcCompRenderer**：10 类组件桌面版式（4.3 表），px 直读、价格分→元、图标白名单回退（复用 `client-icons.js` 既有常量）、goodsRow grid/scroll 双布局、空素材占位样式对齐现有 CompRenderer 风格。
- **T5 电脑模板与空态引导**：电脑版模板 2–3 套（默认值按 4.3 内联）；空画布「导入手机版布局」（深拷贝手机 components 换新 _id，进撤销栈一步可撤）。

### P2 属性面板与历史抽屉双端适配（admin）
**文件所有权**：`admin/src/components/PropsEditor.vue`、`admin/src/components/builder/RevisionDrawer.vue`

- **T6 device 感知面板**：新增可选 prop `device`（缺省 `'mobile'`，现状零变化）；按 4.5 切换 navGrid/goodsRow 列数区间、banner/imageAd 高度区间；电脑模式追加桌面提示文案（素材尺寸建议、栅格说明）。
- **T7 历史抽屉端标注**：按 `page-key` 显示「手机版 / 电脑版」标识与对应草稿 key 提示；功能逻辑不动（已 key 泛型）。
- **T8 兼容自验**：单独构建下（无 P1）现有手机编辑流程回归不变；模拟传入 `device="pc"` 面板区间正确。

### P3 客户端 H5 桌面消费（mini-program）
**文件所有权**：`mini-program/common/page-config.js`、`mini-program/pages/index/index.vue`、新建 `mini-program/components/page-config/config-blocks-pc.vue`

- **T9 判定与缓存**：`page-config.js` 增 `HOME_PC_CONFIG_CACHE_KEY`、`isDesktopViewport()`（`typeof window` 守卫，小程序恒 false）；校验/归一化/链接/图标复用不改。
- **T10 首页接入与回退链**：桌面视口拉 `home-pc`（预览拉 `home-pc-draft`）+ PC 缓存首帧；回退链 home-pc → home 响应式 → 硬编码（5.4）；matchMedia 跨 768 切换分支并懒拉配置；手机与小程序路径零改动；PC 逻辑全部 `#ifdef H5`。
- **T11 桌面渲染器**：`config-blocks-pc.vue` 按 4.3 实现 10 类桌面版式（px 直读、goodsRow 栅格/横滚、图标回退、链接解析复用）；import/使用包 `#ifdef H5`；768–1199 流体收缩无溢出。
- **T12 双端构建回归**：H5 与 mp-weixin 构建通过；未发布 home-pc 时桌面渲染与现状一致（验收 3）；小程序包无新增体积。

### P4 服务端键位护栏与双通道回归（server）
**文件所有权**：`server/src/modules/page-config/page-config.service.ts`（如需常量提取可同目录新建文件）

- **T13 GET 护栏**：未知 key 不再自动建行（返回 `{}` 形状不变）；白名单 = DEFAULT_CONFIGS keys + `settings` + `home-pc` + 各 `-draft` 后缀 + 已存在行；`DEFAULT_CONFIGS` 登记 `"home-pc": {}`。
- **T14 双通道回归自验**：home 与 home-pc 各自跑通 PUT→publish→revisions→rollback→meta 与 200KB 护栏；既有行为（含 `home-draft` 公开读）不变；`server` 构建通过。

### 并行安全性说明

四流文件集合两两无交集（P1=PageBuilder+新建 PC 渲染器、P2=PropsEditor+RevisionDrawer、P3=mini-program 三文件、P4=server page-config service）。跨流仅存运行时松耦合：P1→P2 经可选 `device` prop（双向缺省兼容）；P1/P3 经第 4 章 schema 契约对齐（无代码共享）；P3 读的 `home-pc` 数据由 P1 产生（未发布时走回退链，不依赖合并顺序）；P4 纯加固，任何顺序合并均不影响其余三流。任意子集合并均可独立构建、独立验收。
