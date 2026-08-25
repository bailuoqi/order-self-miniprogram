<template>
<div class="cr-wrap" :style="wrapStyle">
  <!-- Banner / Carousel -->
  <div v-if="type==='banner'" class="cr-banner" :style="{height:p.height+'px',borderRadius:p.radius+'px'}">
    <div v-if="!p.images||!p.images.length" class="cr-banner-empty">
      <i class="ri-image-line"></i><span>轮播图占位</span>
    </div>
    <img v-else class="cr-banner-img" :src="p.images[activeBannerIdx]" />
    <div v-if="p.dots&&p.images&&p.images.length" class="cr-banner-dots">
      <span v-for="(img,i) in p.images" :key="i" class="cr-dot" :class="{on:i===activeBannerIdx}"></span>
    </div>
  </div>

  <!-- Search Bar -->
  <div v-else-if="type==='search'" class="cr-search" :style="{background:p.bgColor,borderRadius:p.radius+'px'}">
    <i class="ri-search-line"></i><span>{{p.placeholder||'搜索'}}</span>
  </div>

  <!-- Notice Bar：图标与客户端同规则走白名单回退 -->
  <div v-else-if="type==='notice'" class="cr-notice" :style="{background:p.bgColor,color:p.color}">
    <i :class="resolveClientIcon(p.ico,'ri-volume-up-line')"></i>
    <span class="cr-notice-text">{{p.text}}</span>
  </div>

  <!-- Nav Grid：图标与客户端同规则走白名单回退 -->
  <div v-else-if="type==='navGrid'" class="cr-navgrid">
    <div v-for="(item,i) in p.items" :key="i" class="cr-navgrid-item" :style="{width:(100/(p.columns||4))+'%',padding:p.gutter+'px'}">
      <div class="cr-navgrid-icon"><i :class="resolveClientIcon(item.icon,'ri-apps-line')"></i></div>
      <div class="cr-navgrid-name">{{item.name}}</div>
    </div>
  </div>

  <!-- Title Bar -->
  <div v-else-if="type==='titleBar'" class="cr-titlebar" :class="'cr-title-'+p.align">
    <div class="cr-titlebar-left">
      <div class="cr-titlebar-title">{{p.title}}</div>
      <div v-if="p.subtitle" class="cr-titlebar-sub">{{p.subtitle}}</div>
    </div>
    <div v-if="p.moreText" class="cr-titlebar-more">{{p.moreText}} <i class="ri-arrow-right-s-line"></i></div>
  </div>

  <!-- Image Ad -->
  <div v-else-if="type==='imageAd'" class="cr-imagead" :style="{height:p.height+'px',borderRadius:p.radius+'px'}">
    <div v-if="!p.src" class="cr-imagead-empty"><i class="ri-image-add-line"></i> 图片广告位</div>
    <img v-else :src="p.src" />
  </div>

  <!-- 已停用的营销组件（二期下架）：灰色占位，存量数据保留、客户端按未知类型跳过 -->
  <div v-else-if="deprecatedLabel" class="cr-deprecated">
    <i class="ri-forbid-line"></i>
    <div class="cr-deprecated-name">已停用组件（客户端不渲染）</div>
    <div class="cr-deprecated-tip">{{deprecatedLabel}} · 产品无此业务模型，可选中后删除；发布时数据原样保留</div>
  </div>

  <!-- Goods Row -->
  <div v-else-if="type==='goodsRow'" class="cr-goodsrow">
    <div v-if="p.title" class="cr-goodsrow-title">{{p.title}}</div>
    <template v-if="p.goods&&p.goods.length">
      <div class="cr-goodsrow-scroll" v-if="p.layout==='scroll'">
        <div v-for="g in p.goods" :key="g.id" class="cr-goods-real">
          <div class="cr-goods-cover">
            <img v-if="g.cover" :src="g.cover" />
            <i v-else class="ri-shopping-bag-3-line"></i>
            <span v-if="p.showBadge" class="cr-goods-badge">荐</span>
          </div>
          <div class="cr-goods-name">{{g.title}}</div>
          <div class="cr-goods-price">¥{{fmtPriceFen(g.price)}}</div>
        </div>
      </div>
      <div class="cr-goodsrow-grid" v-else :style="{gridTemplateColumns:'repeat('+(p.columns||2)+',1fr)'}">
        <div v-for="g in p.goods" :key="g.id" class="cr-goods-real cr-goods-grid">
          <div class="cr-goods-cover">
            <img v-if="g.cover" :src="g.cover" />
            <i v-else class="ri-shopping-bag-3-line"></i>
            <span v-if="p.showBadge" class="cr-goods-badge">荐</span>
          </div>
          <div class="cr-goods-name">{{g.title}}</div>
          <div class="cr-goods-price">¥{{fmtPriceFen(g.price)}}</div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="cr-goodsrow-scroll" v-if="p.layout==='scroll'">
        <div v-for="i in 4" :key="i" class="cr-goodsrow-card"><i class="ri-shopping-bag-3-line"></i><span>商品</span></div>
      </div>
      <div class="cr-goodsrow-grid" v-else :style="{gridTemplateColumns:'repeat('+(p.columns||2)+',1fr)'}">
        <div v-for="i in (p.columns||2)*2" :key="i" class="cr-goodsrow-card"><i class="ri-shopping-bag-3-line"></i><span>商品</span></div>
      </div>
    </template>
  </div>

  <!-- Article List -->
  <div v-else-if="type==='articleList'" class="cr-articlelist">
    <div v-if="p.title" class="cr-articlelist-title">{{p.title}}</div>
    <template v-if="p.cmsType">
      <div v-if="articlesState==='loading'" class="cr-articlelist-tip">文章加载中…</div>
      <div v-else-if="articlesState==='error'" class="cr-articlelist-tip">文章加载失败</div>
      <div v-else-if="!articles.length" class="cr-articlelist-tip">该类型暂无已发布文章</div>
      <div v-else v-for="a in articles.slice(0,p.count||3)" :key="a.id" class="cr-articlelist-item">
        <div v-if="p.showCover" class="cr-articlelist-cover">
          <img v-if="a.cover" :src="a.cover" />
          <i v-else class="ri-image-line"></i>
        </div>
        <div class="cr-articlelist-info">
          <div class="cr-articlelist-name">{{a.title}}</div>
          <div v-if="p.showDate" class="cr-articlelist-date">{{String(a.created_at||'').slice(0,10)}}</div>
        </div>
      </div>
    </template>
    <template v-else>
      <div v-for="i in (p.count||3)" :key="i" class="cr-articlelist-item">
        <div v-if="p.showCover" class="cr-articlelist-cover"><i class="ri-image-line"></i></div>
        <div class="cr-articlelist-info"><div class="cr-articlelist-name">文章标题</div><div v-if="p.showDate" class="cr-articlelist-date">2024-01-01</div></div>
      </div>
    </template>
  </div>

  <!-- Video Player -->
  <div v-else-if="type==='videoPlayer'" class="cr-video" :style="{height:p.height+'px'}">
    <img v-if="p.poster" class="cr-video-poster" :src="p.poster" />
    <div class="cr-video-placeholder"><i class="ri-play-circle-line"></i><span v-if="!p.poster">视频播放器</span></div>
  </div>

  <!-- Rich Text -->
  <div v-else-if="type==='richText'" class="cr-richtext" :style="{padding:p.padding+'px'}" v-html="p.content"></div>

  <!-- Floating Button：预览态相对 phone-screen 悬浮定位，编辑态入流展示 -->
  <div v-else-if="type==='floatingBtn'" :class="['cr-floatbtn', preview?'cr-float-abs':'cr-float-inline', 'cr-float-'+(p.position||'right')]" :style="preview?{bottom:(p.bottom||80)+'px'}:{}">
    <div class="cr-floatbtn-inner"><i :class="p.ico||'ri-customer-service-2-line'"></i><span>{{p.text}}</span></div>
    <span v-if="!preview" class="cr-float-hint">悬浮按钮 · 预览时贴屏悬浮</span>
  </div>

  <!-- Divider -->
  <div v-else-if="type==='divider'" class="cr-divider" :style="{height:p.height+'px',background:p.color,margin:p.margin,borderStyle:p.style}"></div>

  <!-- Blank -->
  <div v-else-if="type==='blank'" class="cr-blank" :style="{height:p.height+'px',background:p.bgColor}"></div>

  <!-- Unknown -->
  <div v-else class="cr-unknown">{{type}}</div>
</div>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import api from '@/api'
import { resolveClientIcon } from '@/components/builder/client-icons'
import { fmtPriceFen } from '@/components/builder/preview-format'

const props = defineProps({ type: String, props: Object, global: Object, preview: Boolean })
const p = computed(() => props.props || {})

// 二期下架的营销组件：存量实例渲染停用占位（客户端按未知类型跳过）
const DEPRECATED_LABELS = { coupon: '优惠券', countdown: '倒计时', groupBuy: '拼团', seckill: '秒杀' }
const deprecatedLabel = computed(() => DEPRECATED_LABELS[props.type] || '')
const wrapStyle = computed(() => {
  const s = {}
  if (p.value.marginTop) s.marginTop = p.value.marginTop + 'px'
  if (p.value.marginBottom) s.marginBottom = p.value.marginBottom + 'px'
  if (p.value.padding) s.padding = p.value.padding + 'px'
  return s
})

// ---- Banner：编辑态静态首图，预览态按 interval 自动轮播 ----
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

// ---- Article List：绑定 CMS 类型时拉取真实文章 ----
const articles = ref([])
const articlesState = ref('')
watch(() => (props.type === 'articleList' ? p.value.cmsType : ''), async (t) => {
  if (!t) { articles.value = []; articlesState.value = ''; return }
  articlesState.value = 'loading'
  try {
    const res = await api.get('/cms/articles', { params: { type: t } })
    articles.value = Array.isArray(res) ? res : []
    articlesState.value = 'done'
  } catch (e) {
    articles.value = []
    articlesState.value = 'error'
  }
}, { immediate: true })
</script>

<style scoped>
.cr-wrap{width:100%;overflow:hidden}
.cr-banner{background:#e8e8e8;overflow:hidden;position:relative}
.cr-banner-img{width:100%;height:100%;object-fit:cover;display:block}
.cr-banner-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#bbb;gap:6px;font-size:13px}
.cr-banner-empty i{font-size:28px}
.cr-banner-dots{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:6px}
.cr-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5);transition:.2s}
.cr-dot.on{background:#fff;width:16px;border-radius:3px}
.cr-search{display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:13px;color:#999;margin:8px 0}
.cr-notice{display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:12px;border-radius:6px;margin:6px 0}
.cr-notice-text{flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.cr-navgrid{display:flex;flex-wrap:wrap;padding:8px 0}
.cr-navgrid-item{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 0;box-sizing:border-box}
.cr-navgrid-icon{width:44px;height:44px;border-radius:12px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:20px;color:#2979FF}
.cr-navgrid-name{font-size:11px;color:#666}
.cr-titlebar{display:flex;align-items:flex-end;justify-content:space-between;padding:12px 0 8px}
.cr-titlebar-title{font-size:16px;font-weight:700;color:#333}
.cr-title-center{justify-content:center;text-align:center}
.cr-titlebar-sub{font-size:12px;color:#999;margin-top:2px}
.cr-titlebar-more{font-size:12px;color:#999;display:flex;align-items:center;gap:2px}
.cr-imagead{background:#e8e8e8;overflow:hidden;margin:6px 0}
.cr-imagead img{width:100%;height:100%;object-fit:cover;display:block}
.cr-imagead-empty{display:flex;align-items:center;justify-content:center;height:100%;color:#bbb;gap:6px;font-size:13px}
.cr-deprecated{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:18px 12px;background:#f5f5f5;border:1px dashed #d9d9d9;border-radius:8px;margin:6px 0;text-align:center}
.cr-deprecated i{font-size:22px;color:#bbb}
.cr-deprecated-name{font-size:12px;font-weight:600;color:#999}
.cr-deprecated-tip{font-size:10px;color:#bbb;line-height:1.5}
.cr-goodsrow{padding:6px 0}
.cr-goodsrow-title{font-size:15px;font-weight:700;margin-bottom:8px}
.cr-goodsrow-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}
.cr-goodsrow-grid{display:grid;gap:8px}
.cr-goodsrow-card{min-width:100px;height:100px;background:#f5f5f5;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#999;font-size:12px;gap:6px}
.cr-goodsrow-card i{font-size:22px}
.cr-goods-real{width:110px;flex-shrink:0;background:#fff;border:1px solid #f0f0f0;border-radius:8px;overflow:hidden}
.cr-goods-real.cr-goods-grid{width:auto}
.cr-goods-cover{position:relative;height:80px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:22px}
.cr-goods-cover img{width:100%;height:100%;object-fit:cover;display:block}
.cr-goods-badge{position:absolute;top:4px;left:4px;background:#ff4d4f;color:#fff;font-size:9px;padding:1px 5px;border-radius:4px;line-height:1.5}
.cr-goods-name{font-size:12px;color:#333;padding:6px 8px 2px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.cr-goods-price{font-size:13px;color:#ff4d4f;font-weight:700;padding:0 8px 8px}
.cr-articlelist{padding:6px 0}
.cr-articlelist-title{font-size:15px;font-weight:700;margin-bottom:8px}
.cr-articlelist-tip{text-align:center;color:#bbb;font-size:12px;padding:16px 0}
.cr-articlelist-item{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #f5f5f5}
.cr-articlelist-cover{width:80px;height:56px;background:#f0f0f0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:20px;flex-shrink:0;overflow:hidden}
.cr-articlelist-cover img{width:100%;height:100%;object-fit:cover;display:block}
.cr-articlelist-info{flex:1;display:flex;flex-direction:column;justify-content:center;min-width:0}
.cr-articlelist-name{font-size:13px;color:#333;font-weight:500;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.cr-articlelist-date{font-size:11px;color:#bbb;margin-top:4px}
.cr-video{background:#1a1a2e;border-radius:8px;margin:6px 0;position:relative;overflow:hidden}
.cr-video-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cr-video-placeholder{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,.75);gap:8px;font-size:13px}
.cr-video-placeholder i{font-size:32px;text-shadow:0 1px 6px rgba(0,0,0,.4)}
.cr-richtext{font-size:14px;line-height:1.6;color:#333}
.cr-floatbtn{z-index:99}
.cr-float-abs{position:absolute}
.cr-float-abs.cr-float-right{right:16px}
.cr-float-abs.cr-float-left{left:16px}
.cr-float-inline{display:flex;align-items:center;gap:8px;padding:4px 2px}
.cr-float-inline.cr-float-right{flex-direction:row-reverse}
.cr-float-hint{font-size:10px;color:#bbb}
.cr-floatbtn-inner{display:flex;flex-direction:column;align-items:center;gap:2px;background:#2979FF;color:#fff;padding:10px 14px;border-radius:24px;font-size:11px;box-shadow:0 4px 12px rgba(41,121,255,.3)}
.cr-floatbtn-inner i{font-size:18px}
.cr-divider{width:100%}
.cr-blank{width:100%}
.cr-unknown{padding:20px;text-align:center;color:#999;background:#f0f0f0;border-radius:4px;font-size:12px}
</style>
