// 预览一致性辅助：价格存储单位为「分」（schemaVersion:1 契约 §5.2），
// 展示时与客户端 fmtPrice 同规则——÷100，整数不留小数、非整数保留两位。
export function fmtPriceFen(fen) {
  const yuan = (Number(fen) || 0) / 100
  return yuan % 1 === 0 ? String(yuan) : yuan.toFixed(2)
}
