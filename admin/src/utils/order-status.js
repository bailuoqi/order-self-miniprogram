/** 订单状态文案与标签色（唯一流程：下单→报价→定金→制作→交付→尾款→评价） */
export const ORDER_STATUS_MAP = {
  pending_quote: '待报价',
  quoting: '报价商议中',
  confirmed: '待收定金',
  deposit_paid: '制作中',
  delivered: '待收尾款',
  final_paid: '待评价',
  completed: '已完成',
  cancelled: '已取消',
  refunding: '退款中',
  refunded: '已退款',
}

export const ORDER_STATUS_TAG = {
  pending_quote: 'tag-orange',
  quoting: 'tag-orange',
  confirmed: 'tag-blue',
  deposit_paid: 'tag-blue',
  delivered: 'tag-orange',
  final_paid: 'tag-orange',
  completed: 'tag-green',
  cancelled: 'tag-red',
  refunding: 'tag-orange',
  refunded: 'tag-red',
}

/** 订单来源（server OrderSource：product=标准服务下单 / custom=自定义需求） */
export const ORDER_SOURCE_MAP = {
  product: '标准服务',
  custom: '自定义',
}

export const ORDER_SOURCE_TAG = {
  product: 'tag-blue',
  custom: 'tag-orange',
}

/** 退款状态（server RefundStatus） */
export const REFUND_STATUS_MAP = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  completed: '已完成',
}

export const REFUND_STATUS_TAG = {
  pending: 'tag-orange',
  approved: 'tag-green',
  rejected: 'tag-red',
  completed: 'tag-green',
}

export const fmtFen = (fen) => ((fen || 0) / 100).toFixed(2)

/** 文件大小可读化：1024 → 1KB */
export const fmtBytes = (bytes) => {
  const n = +bytes
  if (!n || n <= 0) return ''
  if (n < 1024) return n + 'B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + 'KB'
  return (n / 1024 / 1024).toFixed(1) + 'MB'
}

/** 判断内容是否为站内上传的图片 URL（聊天消息降级渲染缩略图用） */
export const isUploadImageUrl = (s) =>
  typeof s === 'string' && /^\/uploads\/[^\s]+\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(s.trim())
