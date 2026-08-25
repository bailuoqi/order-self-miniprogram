// 客户端图标白名单（常量副本，唯一权威清单见 docs/后台管理系统电脑网页适配二期施工方案.md §5.4）
// = mini-program/static/fonts/remixicon-trimmed.css 既有 76 类 + 二期追加 10 类。
// 白名单外的图标客户端会统一回退为 CLIENT_ICON_FALLBACK，编辑器画布与选择器需按同一规则对齐。

export const CLIENT_ICON_FALLBACK = 'ri-apps-2-line'

// 二期追加的 10 类（覆盖编辑器默认值与常用导航语义），置于列表头部方便选取
const PHASE2_ICONS = [
  'ri-service-line',
  'ri-calendar-line',
  'ri-star-line',
  'ri-more-line',
  'ri-volume-up-line',
  'ri-image-line',
  'ri-search-line',
  'ri-apps-line',
  'ri-shopping-bag-3-line',
  'ri-gift-line',
]

// remixicon-trimmed.css 既有 76 类
const TRIMMED_ICONS = [
  'ri-add-circle-line',
  'ri-add-line',
  'ri-alarm-line',
  'ri-apps-2-line',
  'ri-arrow-down-s-line',
  'ri-arrow-right-line',
  'ri-arrow-right-s-line',
  'ri-arrow-up-down-line',
  'ri-article-line',
  'ri-attachment-2',
  'ri-award-line',
  'ri-bank-line',
  'ri-box-3-line',
  'ri-briefcase-4-fill',
  'ri-briefcase-4-line',
  'ri-calendar-2-line',
  'ri-calendar-check-line',
  'ri-chat-3-line',
  'ri-checkbox-circle-fill',
  'ri-checkbox-circle-line',
  'ri-check-line',
  'ri-close-circle-fill',
  'ri-close-circle-line',
  'ri-close-line',
  'ri-code-s-slash-line',
  'ri-cpu-line',
  'ri-customer-service-2-line',
  'ri-edit-box-line',
  'ri-edit-line',
  'ri-eye-2-line',
  'ri-file-code-line',
  'ri-file-list-2-line',
  'ri-file-list-3-line',
  'ri-fire-line',
  'ri-flashlight-line',
  'ri-funds-line',
  'ri-global-line',
  'ri-heart-3-fill',
  'ri-heart-3-line',
  'ri-id-card-line',
  'ri-image-2-line',
  'ri-inbox-line',
  'ri-information-line',
  'ri-lock-2-line',
  'ri-logout-box-line',
  'ri-map-pin-2-line',
  'ri-money-cny-circle-line',
  'ri-notification-3-line',
  'ri-pencil-line',
  'ri-plug-line',
  'ri-question-answer-line',
  'ri-refresh-line',
  'ri-rocket-line',
  'ri-route-line',
  'ri-search-2-line',
  'ri-secure-payment-line',
  'ri-send-plane-line',
  'ri-settings-3-line',
  'ri-shield-check-line',
  'ri-smartphone-line',
  'ri-stack-line',
  'ri-star-fill',
  'ri-star-smile-line',
  'ri-task-line',
  'ri-team-line',
  'ri-terminal-box-line',
  'ri-thumb-up-line',
  'ri-time-line',
  'ri-tools-line',
  'ri-upload-2-line',
  'ri-user-3-fill',
  'ri-user-3-line',
  'ri-user-star-line',
  'ri-wallet-3-line',
  'ri-wechat-2-line',
  'ri-wechat-pay-line',
]

export const CLIENT_ICONS = [...PHASE2_ICONS, ...TRIMMED_ICONS]

const ICON_SET = new Set(CLIENT_ICONS)

export function isClientIcon(cls) {
  return ICON_SET.has(cls)
}

// 画布渲染与客户端同规则：空值取默认，白名单外统一回退
export function resolveClientIcon(cls, dft) {
  const v = cls || dft || CLIENT_ICON_FALLBACK
  return ICON_SET.has(v) ? v : CLIENT_ICON_FALLBACK
}
