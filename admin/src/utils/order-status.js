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

export const fmtFen = (fen) => ((fen || 0) / 100).toFixed(2)
