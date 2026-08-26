/**
 * 首页装修配置（page-config/home）消费工具 —— 二期 C1 / U1。
 * 纯常量与纯函数，无平台差异代码，两端（mp-weixin / H5）通用；
 * schema 契约以《后台管理系统电脑网页适配二期施工方案》第 5 章为唯一权威；
 * 电脑版（home-pc 双 key）契约以《后台 PC 网页端装修施工方案》第 4 章为唯一权威。
 */

// 本地缓存键：合法线上配置缓存一份，下次启动首帧直出（草稿预览不写缓存）
export const HOME_CONFIG_CACHE_KEY = 'home_page_config';

// 电脑版配置（page-config/home-pc）本地缓存键，与手机版缓存互相独立（P3 / T9）
export const HOME_PC_CONFIG_CACHE_KEY = 'home_pc_page_config';

/**
 * 桌面视口判定（P3 / T9）：≥768px 读电脑版配置，断点与 topWindow /
 * $bp-tablet 完全对齐（4.5）。小程序端无 window，恒返回 false。
 */
export function isDesktopViewport() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(min-width: 768px)').matches;
  } catch (e) {
    return false;
  }
}

// 客户端渲染子集（5.2）：子集外类型（coupon/countdown/groupBuy/seckill/
// videoPlayer/articleList/floatingBtn 及未来新增）一律静默跳过，保证前向兼容
export const SUPPORTED_TYPES = [
  'banner', 'search', 'notice', 'navGrid', 'titleBar',
  'imageAd', 'goodsRow', 'richText', 'divider', 'blank',
];

// global 缺省值（与编辑器画布缺省一致；showTabbar/tabItems 不消费）
const GLOBAL_DEFAULTS = {
  pageTitle: '',
  bgColor: '#f5f6fa',
  navStyle: 'default',
  navBgColor: '#ffffff',
  navTextColor: '#333333',
};

// tabBar 页清单（与 pages.json 对齐）：/pages/ 链接命中走 switchTab，其余 navigateTo
const TAB_PAGES = [
  '/pages/index/index',
  '/pages/message/message',
  '/pages/order/list',
  '/pages/my/index',
];

// 图标白名单（5.4）= remixicon-trimmed.css 既有 76 类 + 二期追加 10 类；
// 与该 CSS 文件的类清单保持同步，白名单外统一回退 ICON_FALLBACK
export const ICON_FALLBACK = 'ri-apps-2-line';
export const ICON_WHITELIST = [
  'ri-add-circle-line', 'ri-add-line', 'ri-alarm-line', 'ri-apps-2-line',
  'ri-arrow-down-s-line', 'ri-arrow-right-line', 'ri-arrow-right-s-line',
  'ri-arrow-up-down-line', 'ri-article-line', 'ri-attachment-2', 'ri-award-line',
  'ri-bank-line', 'ri-box-3-line', 'ri-briefcase-4-fill', 'ri-briefcase-4-line',
  'ri-calendar-2-line', 'ri-calendar-check-line', 'ri-chat-3-line',
  'ri-checkbox-circle-fill', 'ri-checkbox-circle-line', 'ri-check-line',
  'ri-close-circle-fill', 'ri-close-circle-line', 'ri-close-line',
  'ri-code-s-slash-line', 'ri-cpu-line', 'ri-customer-service-2-line',
  'ri-edit-box-line', 'ri-edit-line', 'ri-eye-2-line', 'ri-file-code-line',
  'ri-file-list-2-line', 'ri-file-list-3-line', 'ri-fire-line',
  'ri-flashlight-line', 'ri-funds-line', 'ri-global-line', 'ri-heart-3-fill',
  'ri-heart-3-line', 'ri-id-card-line', 'ri-image-2-line', 'ri-inbox-line',
  'ri-information-line', 'ri-lock-2-line', 'ri-logout-box-line',
  'ri-map-pin-2-line', 'ri-money-cny-circle-line', 'ri-notification-3-line',
  'ri-pencil-line', 'ri-plug-line', 'ri-question-answer-line', 'ri-refresh-line',
  'ri-rocket-line', 'ri-route-line', 'ri-search-2-line', 'ri-secure-payment-line',
  'ri-send-plane-line', 'ri-settings-3-line', 'ri-shield-check-line',
  'ri-smartphone-line', 'ri-stack-line', 'ri-star-fill', 'ri-star-smile-line',
  'ri-task-line', 'ri-team-line', 'ri-terminal-box-line', 'ri-thumb-up-line',
  'ri-time-line', 'ri-tools-line', 'ri-upload-2-line', 'ri-user-3-fill',
  'ri-user-3-line', 'ri-user-star-line', 'ri-wallet-3-line', 'ri-wechat-2-line',
  'ri-wechat-pay-line',
  // 二期追加（5.4）：覆盖编辑器默认值与常用导航语义
  'ri-service-line', 'ri-calendar-line', 'ri-star-line', 'ri-more-line',
  'ri-volume-up-line', 'ri-image-line', 'ri-search-line', 'ri-apps-line',
  'ri-shopping-bag-3-line', 'ri-gift-line',
];

/**
 * 三形状嗅探（5.1）：新规范 {schemaVersion,components,global} / 直接对象 /
 * 旧 {data:"json"} 双重 JSON；再兼容 {config:{...}} 包一层的存法。
 * 嗅探失败返回 null（视为「无配置」）。
 */
export function sniffPageConfig(raw) {
  let v = raw;
  try {
    if (typeof v === 'string') v = JSON.parse(v);
    if (v && typeof v === 'object') {
      if (typeof v.data === 'string') v = JSON.parse(v.data);
      else if (v.data && typeof v.data === 'object' && !Array.isArray(v.data)) v = v.data;
    }
    if (v && typeof v === 'object' && v.config && typeof v.config === 'object' && !Array.isArray(v.components)) {
      v = v.config;
    }
  } catch (e) {
    return null;
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  return v;
}

/** 单组件是否可渲染：类型属于子集且未命中空值跳过规则（5.2） */
export function isRenderableComponent(comp) {
  if (!comp || typeof comp !== 'object') return false;
  if (SUPPORTED_TYPES.indexOf(comp.type) === -1) return false;
  const p = (comp.props && typeof comp.props === 'object') ? comp.props : {};
  switch (comp.type) {
    case 'banner': {
      const imgs = Array.isArray(p.images) ? p.images.filter((s) => typeof s === 'string' && s.trim()) : [];
      return imgs.length > 0;
    }
    case 'notice':
      return !!(p.text && String(p.text).trim());
    case 'navGrid':
      return Array.isArray(p.items) && p.items.length > 0;
    case 'titleBar':
      return !!(p.title && String(p.title).trim());
    case 'imageAd':
      return !!(p.src && String(p.src).trim());
    case 'goodsRow':
      return Array.isArray(p.goods) && p.goods.length > 0;
    case 'richText':
      return !!(p.content && String(p.content).trim());
    // search / divider / blank 恒渲染
    default:
      return true;
  }
}

/**
 * 合法配置判定（5.2 统一规则）：schemaVersion === 1 且 components 为数组
 * 且至少 1 个属于子集且非空跳过的组件；不满足即走硬编码兜底。
 */
export function isValidPageConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') return false;
  if (cfg.schemaVersion !== 1) return false;
  if (!Array.isArray(cfg.components)) return false;
  return cfg.components.some(isRenderableComponent);
}

/**
 * 归一化为渲染态：过滤掉不可渲染组件（未知类型/空组件静默跳过）、
 * 补 _id、合并 global 缺省值。调用前须先过 isValidPageConfig。
 */
export function normalizePageConfig(cfg) {
  const components = cfg.components
    .filter(isRenderableComponent)
    .map((c, i) => ({
      _id: c._id || 'pc_' + i,
      type: c.type,
      props: (c.props && typeof c.props === 'object') ? c.props : {},
    }));
  const global = Object.assign({}, GLOBAL_DEFAULTS, (cfg.global && typeof cfg.global === 'object') ? cfg.global : {});
  return { components, global };
}

/** 尺寸换算（5.2）：props 数值 px 以 375 宽画板为基准，客户端 rpx = px × 2 */
export function pxToRpx(px, fallback) {
  const n = Number(px);
  if (Number.isFinite(n)) return n * 2;
  const f = Number(fallback);
  return Number.isFinite(f) ? f * 2 : 0;
}

/** 复合 px 值换算：'12px 0' / '8px 12px' 等逐段 ×2 转 rpx（用于 divider.margin） */
export function pxStyleToRpx(val) {
  if (typeof val === 'number') return pxToRpx(val) + 'rpx';
  if (typeof val !== 'string' || !val.trim()) return '';
  return val.trim().split(/\s+/).map((token) => {
    const m = token.match(/^(-?\d+(?:\.\d+)?)px$/i);
    if (m) return Number(m[1]) * 2 + 'rpx';
    const n = Number(token);
    if (Number.isFinite(n) && token !== '0') return n * 2 + 'rpx';
    return token;
  }).join(' ');
}

/** 价格格式化：存储单位为分，显示 ÷100；整元不带小数 */
export function fmtPriceFen(fen) {
  const yuan = (Number(fen) || 0) / 100;
  return yuan % 1 === 0 ? String(yuan) : yuan.toFixed(2);
}

/**
 * 链接解析（5.3）——纯解析不执行跳转：
 * - '' → { kind:'none' }（不可点击）
 * - /pages/...  → tabBar 四页 { kind:'tab' }，其余 { kind:'page' }
 * - /subpkg/... → { kind:'page' }
 * - http(s)://  → { kind:'external' }（H5 直跳、小程序复制链接）
 * - 其余解析失败 → { kind:'none' }（静默忽略，不抛错）
 */
export function resolveLink(link) {
  const url = (typeof link === 'string' ? link : '').trim();
  if (!url) return { kind: 'none', url: '' };
  if (/^https?:\/\//i.test(url)) return { kind: 'external', url };
  if (url.indexOf('/pages/') === 0) {
    const path = url.split('?')[0];
    return TAB_PAGES.indexOf(path) !== -1
      ? { kind: 'tab', url: path }
      : { kind: 'page', url };
  }
  if (url.indexOf('/subpkg/') === 0) return { kind: 'page', url };
  return { kind: 'none', url: '' };
}

/** 图标白名单回退（5.4）：白名单外统一回退 ri-apps-2-line */
export function safeIcon(icon) {
  const name = (typeof icon === 'string' ? icon : '').trim();
  return ICON_WHITELIST.indexOf(name) !== -1 ? name : ICON_FALLBACK;
}

/**
 * 品牌名提取（U6）：从 GET /page-config/settings 响应中取 brand_name，
 * 兼容 {config:{...}} / 字符串 JSON 等形状；取不到返回 ''（调用方回退「定制接单」）。
 */
export function pickBrandName(raw) {
  const v = sniffPageConfig(raw);
  if (!v) return '';
  const name = v.brand_name;
  return (typeof name === 'string' && name.trim()) ? name.trim() : '';
}
