<template>
<div class="pcr-wrap" :style="wrapStyle">
  <!-- Banner：内容列内通栏（1200 宽）swiper，高度 px 直读（默认 320，见方案 §4.3） -->
  <div v-if="type==='banner'" class="pcr-banner" :style="{height:num(p.height,320)+'px',borderRadius:num(p.radius,12)+'px'}">
    <div v-if="!p.images||!p.images.length" class="pcr-empty">
      <i class="ri-image-line"></i><span>轮播图占位 · 桌面建议 1200×320 以上宽图</span>
    </div>
    <img v-else class="pcr-banner-img" :src="p.images[activeBannerIdx]" />
    <div v-if="p.dots&&p.images&&p.images.length" class="pcr-banner-dots">
      <span v-for="(img,i) in p.images" :key="i" class="pcr-dot" :class="{on:i===activeBannerIdx}"></span>
    </div>
  </div>

  <!-- Search：居中展示，最大宽 560px（§4.3） -->
  <div v-else-if="type==='search'" class="pcr-search-row">
    <div class="pcr-search" :style="{background:p.bgColor||'#fff',borderRadius:num(p.radius,22)+'px'}">
      <i class="ri-search-line"></i><span>{{p.placeholder||'搜索'}}</span>
    </div>
  </div>

  <!-- Notice：通栏单行省略条；图标与客户端同规则走白名单回退 -->
  <div v-else-if="type==='notice'" class="pcr-notice" :style="{background:p.bgColor,color:p.color}">
    <i :class="resolveClientIcon(p.ico,'ri-volume-up-line')"></i>
    <span class="pcr-notice-text">{{p.text}}</span>
  </div>

  <!-- Nav Grid：每行 columns 个（默认 8），图标卡片 56px，minmax 栅格防溢出 -->
  <div v-else-if="type==='navGrid'" class="pcr-navgrid" :style="{gridTemplateColumns:'repeat('+num(p.columns,8)+',minmax(0,1fr))',gap:num(p.gutter,12)+'px'}">
    <div v-for="(item,i) in p.items" :key="i" class="pcr-navgrid-item">
      <div class="pcr-navgrid-icon"><i :class="resolveClientIcon(item.icon,'ri-apps-line')"></i></div>
      <div class="pcr-navgrid-name">{{item.name}}</div>
    </div>
  </div>

  <!-- Title Bar：标题 20px / 更多右置；align:center 居中 -->
  <div v-else-if="type==='titleBar'" class="pcr-titlebar" :class="'pcr-title-'+(p.align||'left')">
    <div class="pcr-titlebar-left">
      <div class="pcr-titlebar-title">{{p.title}}</div>
      <div v-if="p.subtitle" class="pcr-titlebar-sub">{{p.subtitle}}</div>
    </div>
    <div v-if="p.moreText" class="pcr-titlebar-more">{{p.moreText}} <i class="ri-arrow-right-s-line"></i></div>
  </div>

  <!-- Image Ad：通栏图，高度 px 直读（默认 200）；width 不消费（恒 100%） -->
  <div v-else-if="type==='imageAd'" class="pcr-imagead" :style="{height:num(p.height,200)+'px',borderRadius:num(p.radius,12)+'px'}">
    <div v-if="!p.src" class="pcr-empty"><i class="ri-image-add-line"></i> 图片广告位 · 桌面通栏 1200 宽</div>
    <img v-else :src="p.src" />
  </div>

  <!-- 已停用的营销组件（二期下架）：灰色占位，两端语义一致 -->
  <div v-else-if="deprecatedLabel" class="pcr-deprecated">
    <i class="ri-forbid-line"></i>
    <div class="pcr-deprecated-name">已停用组件（客户端不渲染）</div>
    <div class="pcr-deprecated-tip">{{deprecatedLabel}} · 产品无此业务模型，可选中后删除；发布时数据原样保留</div>
  </div>

  <!-- Goods Row：grid = repeat(columns,minmax(0,1fr))（默认 4 列）；scroll = 横滚卡片固定宽 280px -->
  <div v-else-if="type==='goodsRow'" class="pcr-goodsrow">
    <div v-if="p.title" class="pcr-goodsrow-title">{{p.title}}</div>
    <template v-if="p.goods&&p.goods.length">
      <div class="pcr-goodsrow-scroll" v-if="p.layout==='scroll'">
        <div v-for="g in p.goods" :key="g.id" class="pcr-goods-card">
          <div class="pcr-goods-cover">
            <img v-if="g.cover" :src="g.cover" />
            <i v-else class="ri-shopping-bag-3-line"></i>
            <span v-if="p.showBadge" class="pcr-goods-badge">荐</span>
          </div>
          <div class="pcr-goods-name">{{g.title}}</div>
          <div class="pcr-goods-price">¥{{fmtPriceFen(g.price)}}</div>
        </div>
      </div>
      <div class="pcr-goodsrow-grid" v-else :style="{gridTemplateColumns:'repeat('+num(p.columns,4)+',minmax(0,1fr))'}">
        <div v-for="g in p.goods" :key="g.id" class="pcr-goods-card pcr-goods-grid">
          <div class="pcr-goods-cover">
            <img v-if="g.cover" :src="g.cover" />
            <i v-else class="ri-shopping-bag-3-line"></i>
            <span v-if="p.showBadge" class="pcr-goods-badge">荐</span>
          </div>
          <div class="pcr-goods-name">{{g.title}}</div>
          <div class="pcr-goods-price">¥{{fmtPriceFen(g.price)}}</div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="pcr-goodsrow-scroll" v-if="p.layout==='scroll'">
        <div v-for="i in 4" :key="i" class="pcr-goods-ph"><i class="ri-shopping-bag-3-line"></i><span>商品</span></div>
      </div>
      <div class="pcr-goodsrow-grid" v-else :style="{gridTemplateColumns:'repeat('+num(p.columns,4)+',minmax(0,1fr))'}">
        <div v-for="i in num(p.columns,4)" :key="i" class="pcr-goods-ph"><i class="ri-shopping-bag-3-line"></i><span>商品</span></div>
      </div>
    </template>
  </div>

  <!-- Rich Text：白底卡片通栏（padding 默认 16） -->
  <div v-else-if="type==='richText'" class="pcr-richtext" :style="{padding:num(p.padding,16)+'px'}" v-html="p.content"></div>

  <!-- 客户端不渲染类型（articleList/videoPlayer/floatingBtn）：桌面画布示意占位，标注体系与手机端一致 -->
  <div v-else-if="type==='articleList'" class="pcr-articlelist">
    <div v-if="p.title" class="pcr-articlelist-title">{{p.title}}</div>
    <div class="pcr-articlelist-grid">
      <div v-for="i in num(p.count,3)" :key="i" class="pcr-articlelist-item">
        <div v-if="p.showCover" class="pcr-articlelist-cover"><i class="ri-image-line"></i></div>
        <div class="pcr-articlelist-info">
          <div class="pcr-articlelist-name">文章标题</div>
          <div v-if="p.showDate" class="pcr-articlelist-date">2024-01-01</div>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="type==='videoPlayer'" class="pcr-video" :style="{height:num(p.height,200)+'px'}">
    <img v-if="p.poster" class="pcr-video-poster" :src="p.poster" />
    <div class="pcr-video-placeholder"><i class="ri-play-circle-line"></i><span v-if="!p.poster">视频播放器</span></div>
  </div>

  <div v-else-if="type==='floatingBtn'" class="pcr-floatbtn">
    <div class="pcr-floatbtn-inner"><i :class="p.ico||'ri-customer-service-2-line'"></i><span>{{p.text}}</span></div>
    <span class="pcr-float-hint">悬浮按钮 · 客户端桌面不渲染</span>
  </div>

  <!-- Divider / Blank：px 直读，恒渲染 -->
  <div v-else-if="type==='divider'" class="pcr-divider" :style="{height:num(p.height,1)+'px',background:p.color,margin:p.margin,borderStyle:p.style}"></div>

  <div v-else-if="type==='blank'" class="pcr-blank" :style="{height:num(p.height,24)+'px',background:p.bgColor}"></div>

  <!-- Unknown -->
  <div v-else class="pcr-unknown">{{type}}</div>
</div>
</template>

<script setup>
// 电脑版画布组件渲染器（施工方案 P1/T4）：10 类组件桌面版式按 §4.3 表实现。
// 与手机版 CompRenderer 的关键差异：props 中 px 一律按 CSS px 直读（§4.5），
// 默认值为桌面尺度（banner 320 / imageAd 200 / goodsRow 4 列 / navGrid 8 列），
// 价格分→元与图标白名单回退复用既有常量，占位样式对齐 CompRenderer 风格。
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { resolveClientIcon } from '@/components/builder/client-icons'
import { fmtPriceFen } from '@/components/builder/preview-format'

const props = defineProps({ type: String, props: Object, global: Object, preview: Boolean })
const p = computed(() => props.props || {})

// 数值型 props 容错：非法/缺失取桌面默认值（§4.3），0 等合法值原样直读
function num(v, dft) {
  const n = Number(v)
  return Number.isFinite(n) ? n : dft
}

// 二期下架的营销组件：存量实例渲染停用占位（客户端按未知类型跳过）
const DEPRECATED_LABELS = { coupon: '优惠券', countdown: '倒计时', groupBuy: '拼团', seckill: '秒杀' }
const deprecatedLabel = computed(() => DEPRECATED_LABELS[props.type] || '')

const wrapStyle = computed(() => {
  const s = {}
  if (p.value.marginTop) s.marginTop = p.value.marginTop + 'px'
  if (p.value.marginBottom) s.marginBottom = p.value.marginBottom + 'px'
  return s
})

// ---- Banner：编辑态静态首图，预览态按 interval 自动轮播（与 CompRenderer 同规则）----
const bannerIdx = ref(0)
const activeBannerIdx = computed(() => {
  const len = (p.value.images || []).length
  return len ? Math.min(bannerIdx.value, len - 1) : 0
})
let bannerTimer = null
function stopBanner() {
  if (bannerTimer) { clearInterval(bannerTimer); bannerTimer = null }
}
watch([() => props.preview, () => (p.value.images || []).length, () => p.value.interval], () => {
  stopBanner()
  bannerIdx.value = 0
  const len = (p.value.images || []).length
  if (props.type === 'banner' && props.preview && len > 1) {
    const interval = Math.max(1000, Number(p.value.interval) || 3000)
    bannerTimer = setInterval(() => { bannerIdx.value = (bannerIdx.value + 1) % len }, interval)
  }
}, { immediate: true })
onBeforeUnmount(stopBanner)
</script>

<style scoped>
.pcr-wrap{width:100%;overflow:hidden}
.pcr-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#bbb;gap:8px;font-size:13px}
.pcr-empty i{font-size:34px}
.pcr-banner{background:#e8e8e8;overflow:hidden;position:relative}
.pcr-banner-img{width:100%;height:100%;object-fit:cover;display:block}
.pcr-banner-dots{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:8px}
.pcr-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.5);transition:.2s}
.pcr-dot.on{background:#fff;width:22px;border-radius:4px}
.pcr-search-row{display:flex;justify-content:center;margin:12px 0}
.pcr-search{display:flex;align-items:center;gap:10px;padding:12px 20px;font-size:14px;color:#999;width:100%;max-width:560px;border:1px solid #eee;box-sizing:border-box}
.pcr-notice{display:flex;align-items:center;gap:10px;padding:12px 18px;font-size:13px;border-radius:8px;margin:8px 0}
.pcr-notice-text{flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.pcr-navgrid{display:grid;padding:12px 0}
.pcr-navgrid-item{display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px 0;min-width:0}
.pcr-navgrid-icon{width:56px;height:56px;border-radius:14px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:24px;color:#2979FF}
.pcr-navgrid-name{font-size:13px;color:#666;max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.pcr-titlebar{display:flex;align-items:flex-end;justify-content:space-between;padding:16px 0 10px}
.pcr-titlebar-title{font-size:20px;font-weight:700;color:#333}
.pcr-title-center{justify-content:center;text-align:center}
.pcr-titlebar-sub{font-size:13px;color:#999;margin-top:4px}
.pcr-titlebar-more{font-size:13px;color:#999;display:flex;align-items:center;gap:2px}
.pcr-imagead{background:#e8e8e8;overflow:hidden;margin:8px 0}
.pcr-imagead img{width:100%;height:100%;object-fit:cover;display:block}
.pcr-imagead .pcr-empty{flex-direction:row}
.pcr-imagead .pcr-empty i{font-size:20px}
.pcr-deprecated{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:22px 16px;background:#f5f5f5;border:1px dashed #d9d9d9;border-radius:10px;margin:8px 0;text-align:center}
.pcr-deprecated i{font-size:24px;color:#bbb}
.pcr-deprecated-name{font-size:13px;font-weight:600;color:#999}
.pcr-deprecated-tip{font-size:11px;color:#bbb;line-height:1.5}
.pcr-goodsrow{padding:8px 0}
.pcr-goodsrow-title{font-size:18px;font-weight:700;margin-bottom:12px}
.pcr-goodsrow-scroll{display:flex;gap:16px;overflow-x:auto;padding-bottom:6px}
.pcr-goodsrow-grid{display:grid;gap:16px}
.pcr-goods-card{width:280px;flex-shrink:0;background:#fff;border:1px solid #f0f0f0;border-radius:10px;overflow:hidden}
.pcr-goods-card.pcr-goods-grid{width:auto}
.pcr-goods-cover{position:relative;height:170px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:30px}
.pcr-goods-cover img{width:100%;height:100%;object-fit:cover;display:block}
.pcr-goods-badge{position:absolute;top:8px;left:8px;background:#ff4d4f;color:#fff;font-size:11px;padding:2px 7px;border-radius:5px;line-height:1.5}
.pcr-goods-name{font-size:14px;color:#333;padding:10px 12px 4px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.pcr-goods-price{font-size:16px;color:#ff4d4f;font-weight:700;padding:0 12px 12px}
.pcr-goods-ph{min-width:280px;height:170px;background:#f5f5f5;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#999;font-size:13px;gap:8px}
.pcr-goodsrow-grid .pcr-goods-ph{min-width:0}
.pcr-goods-ph i{font-size:28px}
.pcr-richtext{font-size:14px;line-height:1.7;color:#333;background:#fff;border-radius:10px;margin:8px 0}
.pcr-articlelist{padding:8px 0}
.pcr-articlelist-title{font-size:18px;font-weight:700;margin-bottom:12px}
.pcr-articlelist-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.pcr-articlelist-item{display:flex;gap:12px;padding:12px;background:#fff;border:1px solid #f0f0f0;border-radius:10px;min-width:0}
.pcr-articlelist-cover{width:96px;height:64px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:22px;flex-shrink:0}
.pcr-articlelist-info{flex:1;display:flex;flex-direction:column;justify-content:center;min-width:0}
.pcr-articlelist-name{font-size:14px;color:#333;font-weight:500;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.pcr-articlelist-date{font-size:12px;color:#bbb;margin-top:5px}
.pcr-video{background:#1a1a2e;border-radius:10px;margin:8px 0;position:relative;overflow:hidden}
.pcr-video-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pcr-video-placeholder{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,.75);gap:8px;font-size:14px}
.pcr-video-placeholder i{font-size:36px;text-shadow:0 1px 6px rgba(0,0,0,.4)}
.pcr-floatbtn{display:flex;align-items:center;gap:10px;padding:6px 2px;flex-direction:row-reverse;justify-content:flex-start}
.pcr-floatbtn-inner{display:flex;flex-direction:column;align-items:center;gap:2px;background:#2979FF;color:#fff;padding:12px 16px;border-radius:28px;font-size:12px;box-shadow:0 4px 12px rgba(41,121,255,.3)}
.pcr-floatbtn-inner i{font-size:20px}
.pcr-float-hint{font-size:11px;color:#bbb}
.pcr-divider{width:100%}
.pcr-blank{width:100%}
.pcr-unknown{padding:24px;text-align:center;color:#999;background:#f0f0f0;border-radius:6px;font-size:13px}
</style>
