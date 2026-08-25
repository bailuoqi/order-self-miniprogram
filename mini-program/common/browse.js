/**
 * 浏览链路（首页 / 服务分类 / 标准服务列表 / 服务详情）共享的展示配置。
 * 纯常量与纯函数，无平台差异代码，两端（mp-weixin / H5）通用。
 *
 * 注意：这里引用的 remixicon 图标名必须存在于
 * static/fonts/remixicon-trimmed.css 的类清单中，新增图标先补该文件。
 */

// 分类关键词 → 图标（顺序即匹配优先级：先具体后笼统）
const CATEGORY_ICON_RULES = [
  ['小程序', 'smartphone-line'],
  ['网站', 'global-line'],
  ['官网', 'global-line'],
  ['脚本', 'terminal-box-line'],
  ['工具', 'terminal-box-line'],
  ['接口', 'plug-line'],
  ['对接', 'plug-line'],
  ['二次开发', 'settings-3-line'],
  ['系统', 'settings-3-line'],
  ['PCB', 'stack-line'],
  ['焊接', 'tools-line'],
  ['组装', 'tools-line'],
  ['单片机', 'cpu-line'],
  ['嵌入式', 'cpu-line'],
  ['电路', 'flashlight-line'],
  ['原理图', 'flashlight-line'],
  ['样机', 'box-3-line'],
  ['打样', 'box-3-line'],
];

/** 分类图标名（不带 ri- 前缀）；未命中关键词时按分组兜底 */
export function categoryIconName(cat) {
  const name = (cat && cat.name) || '';
  const hit = CATEGORY_ICON_RULES.find(([kw]) => name.indexOf(kw) !== -1);
  if (hit) return hit[1];
  return cat && cat.group === 'electronics' ? 'cpu-line' : 'code-s-slash-line';
}

/** 服务封面缺省时使用的图标名（跟随其所属分类） */
export function productIconName(product) {
  return categoryIconName(product && product.category);
}

// 服务保障（首页与服务详情共用，对应真实接单流程）
export const GUARANTEES = [
  { icon: 'shield-check-line', title: '先报价后开工', desc: '团队评估需求后出报价，双方确认才动工' },
  { icon: 'secure-payment-line', title: '定金尾款分段付', desc: '确认报价付定金，交付验收满意再结尾款' },
  { icon: 'file-code-line', title: '源码资料交付', desc: '软件交源码与部署说明，硬件交图纸固件' },
  { icon: 'customer-service-2-line', title: '交付后有售后', desc: '质保期内问题免费修复，客服一对一跟进' },
];

// 常见问题（首页展示）
export const FAQS = [
  {
    q: '价格是怎么定的？',
    a: '页面展示的是参考起价。提交需求后，团队按功能范围和工作量评估，在订单里给出正式报价，双方确认后才开工。',
  },
  {
    q: '怎么付款，有保障吗？',
    a: '确认报价后先支付定金，团队开工制作；交付验收满意后再支付尾款。全程在订单内完成，沟通与交付都有记录。',
  },
  {
    q: '中途想调整需求怎么办？',
    a: '小范围调整直接在订单聊天里沟通即可；涉及工作量明显变化时，团队会重新报价，确认后继续制作。',
  },
  {
    q: '交付不满意怎么办？',
    a: '交付前可以随时在订单里提出修改意见；若未按约定交付，可以发起退款申请，定金按平台规则退回。',
  },
];

// 公告缺省文案（后台没有配置公告时的兜底，与下单流程一致）
export const DEFAULT_NOTICE = '下单后团队报价，确认后付定金开工，交付满意再结尾款';
