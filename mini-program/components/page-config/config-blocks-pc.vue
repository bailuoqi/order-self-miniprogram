<!--
  首页装修配置桌面渲染器（P3 / T11，《后台 PC 网页端装修施工方案》4.3）。
  仅供客户端 H5 桌面视口（≥768px）消费 home-pc / home-pc-draft 配置：
  index.vue 中 import 与使用均包 #ifdef H5，本组件不进 mp-weixin 包。
  输入为 normalizePageConfig 归一化后的 components（已滤掉未知类型与空组件）+ global。
  与手机版渲染器（config-blocks.vue）的差异（4.5 契约）：
  - 数值型 px 一律 CSS px 直读，不做 rpx×2 换算；
  - 版式按 4.3 桌面规则：banner/imageAd 通栏、search 居中限宽 560、navGrid 缺省 8 列、
    goodsRow 缺省 grid 4 列（repeat(columns, minmax(0,1fr)) 流体收缩，768–1199 不溢出）；
  - 内容列限宽 1200 由页面既有 content-limit 承担，渲染器内部不再限宽。
  校验/归一化/链接解析/图标白名单/价格分→元全部复用 common/page-config.js 纯函数。
-->
<template>
  <view class="pcd-blocks">
    <view v-for="c in components" :key="c._id" class="pcd-block" :style="wrapStyle(c.props)">
      <!-- 轮播图：内容列内通栏（1200 宽）swiper，高度 px 直读（缺省 320） -->
      <swiper
        v-if="c.type === 'banner'"
        class="pcd-banner"
        :style="{ height: px(c.props.height, 320), borderRadius: px(c.props.radius, 12) }"
        :circular="bannerImages(c.props).length > 1"
        :autoplay="bannerImages(c.props).length > 1"
        :interval="bannerInterval(c.props)"
        :indicator-dots="!!c.props.dots && bannerImages(c.props).length > 1"
        indicator-color="rgba(255,255,255,0.5)"
        indicator-active-color="#ffffff"
      >
        <swiper-item v-for="(img, i) in bannerImages(c.props)" :key="i">
          <image class="pcd-banner-img" :src="img" mode="aspectFill" />
        </swiper-item>
      </swiper>

      <!-- 搜索条：居中展示，最大宽 560px，点击进分类检索（hotWords 不消费） -->
      <view v-else-if="c.type === 'search'" class="pcd-search-wrap">
        <view
          class="pcd-search clickable"
          :style="{ background: c.props.bgColor || '#fff', borderRadius: px(c.props.radius, 22) }"
          @click="goSearch"
        >
          <i class="ri-search-line pcd-search-icon" />
          <text class="pcd-search-text">{{ c.props.placeholder || '搜索' }}</text>
        </view>
      </view>

      <!-- 公告条：通栏单行省略（speed 不消费，不做跑马灯） -->
      <view
        v-else-if="c.type === 'notice'"
        class="pcd-notice"
        :style="{ background: c.props.bgColor || '#fff7e6', color: c.props.color || '#fa8c16' }"
        @click="onLink(c.props.link)"
      >
        <i class="pcd-notice-icon" :class="icon(c.props.ico || 'ri-volume-up-line')" />
        <text class="pcd-notice-text" :style="{ color: c.props.color || '#fa8c16' }">{{ c.props.text }}</text>
      </view>

      <!-- 宫格导航：每行 columns 个（缺省 8），图标卡片 56px，白名单回退 -->
      <view v-else-if="c.type === 'navGrid'" class="pcd-navgrid">
        <view
          v-for="(item, i) in c.props.items"
          :key="i"
          class="pcd-navgrid-item clickable"
          :style="{ width: 100 / gridColumns(c.props, 8) + '%', padding: px(c.props.gutter, 12) }"
          @click="onLink(item.link)"
        >
          <view class="pcd-navgrid-icon"><i :class="icon(item.icon)" /></view>
          <text class="pcd-navgrid-name">{{ item.name }}</text>
        </view>
      </view>

      <!-- 区块标题栏：标题 20px / 更多右置；align:center 居中 -->
      <view
        v-else-if="c.type === 'titleBar'"
        class="pcd-titlebar"
        :class="{ 'pcd-titlebar--center': c.props.align === 'center' }"
      >
        <view class="pcd-titlebar-left">
          <text class="pcd-titlebar-title">{{ c.props.title }}</text>
          <text v-if="c.props.subtitle" class="pcd-titlebar-sub">{{ c.props.subtitle }}</text>
        </view>
        <view v-if="c.props.moreText" class="pcd-titlebar-more clickable" @click="onLink(c.props.moreLink)">
          <text>{{ c.props.moreText }}</text>
          <i class="ri-arrow-right-s-line" />
        </view>
      </view>

      <!-- 图片广告：通栏图，高度 px 直读（缺省 200；width 不消费，恒 100%） -->
      <image
        v-else-if="c.type === 'imageAd'"
        class="pcd-imagead clickable"
        :src="c.props.src"
        mode="aspectFill"
        :style="{ height: px(c.props.height, 200), borderRadius: px(c.props.radius, 12) }"
        @click="onLink(c.props.link)"
      />

      <!-- 服务卡片行：grid 栅格（缺省 4 列，minmax 流体收缩）/ scroll 横滚卡片固定宽 280px -->
      <view v-else-if="c.type === 'goodsRow'" class="pcd-goodsrow">
        <text v-if="c.props.title" class="pcd-goodsrow-title">{{ c.props.title }}</text>
        <scroll-view
          v-if="(c.props.layout || 'grid') === 'scroll'"
          scroll-x
          class="pcd-goods-scroll"
          :show-scrollbar="false"
          enhanced
        >
          <view class="pcd-goods-scroll-inner">
            <view
              v-for="g in c.props.goods"
              :key="g.id"
              class="pcd-goods-card pcd-goods-card--scroll hover-lift clickable"
              @click="goGoods(g)"
            >
              <view class="pcd-goods-cover">
                <image v-if="g.cover" class="pcd-goods-img" :src="g.cover" mode="aspectFill" />
                <view v-else class="pcd-goods-img pcd-goods-img--holder"><i class="ri-shopping-bag-3-line" /></view>
                <view v-if="c.props.showBadge" class="pcd-goods-badge">荐</view>
              </view>
              <view class="pcd-goods-info">
                <text class="pcd-goods-name">{{ g.title }}</text>
                <view class="pcd-goods-price">
                  <text class="pcd-price-symbol">¥</text>
                  <text class="pcd-price-value">{{ price(g.price) }}</text>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
        <view
          v-else
          class="pcd-goods-grid"
          :style="{ gridTemplateColumns: 'repeat(' + gridColumns(c.props, 4) + ', minmax(0, 1fr))' }"
        >
          <view
            v-for="g in c.props.goods"
            :key="g.id"
            class="pcd-goods-card hover-lift clickable"
            @click="goGoods(g)"
          >
            <view class="pcd-goods-cover">
              <image v-if="g.cover" class="pcd-goods-img" :src="g.cover" mode="aspectFill" />
              <view v-else class="pcd-goods-img pcd-goods-img--holder"><i class="ri-shopping-bag-3-line" /></view>
              <view v-if="c.props.showBadge" class="pcd-goods-badge">荐</view>
            </view>
            <view class="pcd-goods-info">
              <text class="pcd-goods-name">{{ g.title }}</text>
              <view class="pcd-goods-price">
                <text class="pcd-price-symbol">¥</text>
                <text class="pcd-price-value">{{ price(g.price) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 富文本：白底卡片通栏，padding px 直读（缺省 16）；组件仅 H5 消费，仍留双端写法防误入 -->
      <view v-else-if="c.type === 'richText'" class="pcd-richtext" :style="{ padding: px(c.props.padding, 16) }">
        <!-- #ifdef H5 -->
        <view class="pcd-richtext-body" v-html="c.props.content" />
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <rich-text class="pcd-richtext-body" :nodes="c.props.content" />
        <!-- #endif -->
      </view>

      <!-- 分割线：px 直读，恒渲染 -->
      <view
        v-else-if="c.type === 'divider'"
        class="pcd-divider"
        :style="{ height: px(c.props.height, 1), background: c.props.color || '#eee', margin: marginPx(c.props.margin) }"
      />

      <!-- 占位块：px 直读（缺省 24），恒渲染 -->
      <view
        v-else-if="c.type === 'blank'"
        class="pcd-blank"
        :style="{ height: px(c.props.height, 24), background: c.props.bgColor || 'transparent' }"
      />

      <!-- 归一化已滤掉未知类型；此处不再兜底渲染 -->
    </view>
  </view>
</template>

<script setup>
// #ifdef H5
import { onMounted, onBeforeUnmount } from 'vue';
// #endif
import { fmtPriceFen, resolveLink, safeIcon } from '@/common/page-config.js';

defineProps({
  components: { type: Array, default: () => [] },
  global: { type: Object, default: () => ({}) },
});

// ---- 模板辅助（4.5 契约：电脑版数值 px 直读，不做 rpx 换算） ----
const px = (v, fb) => {
  const n = Number(v);
  if (Number.isFinite(n)) return n + 'px';
  const f = Number(fb);
  return (Number.isFinite(f) ? f : 0) + 'px';
};
const icon = safeIcon;
const price = fmtPriceFen;

const wrapStyle = (p) => {
  const s = {};
  if (p && p.marginTop) s.marginTop = px(p.marginTop);
  if (p && p.marginBottom) s.marginBottom = px(p.marginBottom);
  return s;
};

const bannerImages = (p) =>
  (Array.isArray(p.images) ? p.images : []).filter((img) => typeof img === 'string' && img.trim());

const bannerInterval = (p) => Math.max(1000, Number(p.interval) || 3000);

const gridColumns = (p, fb) => {
  const n = Math.floor(Number(p.columns));
  return Number.isFinite(n) && n > 0 ? n : fb;
};

/** 复合 px 值直读：'12px 0' / 数值逐段补 px（用于 divider.margin，缺省 12px 0） */
const pxStyle = (val) => {
  if (typeof val === 'number') return val + 'px';
  if (typeof val !== 'string' || !val.trim()) return '';
  return val.trim().split(/\s+/).map((token) => {
    if (/^-?\d+(?:\.\d+)?px$/i.test(token)) return token;
    const n = Number(token);
    if (Number.isFinite(n) && token !== '0') return n + 'px';
    return token;
  }).join(' ');
};
const marginPx = (val) => pxStyle(val === undefined || val === null || val === '' ? '12px 0' : val);

// ---- 链接解析执行（复用 resolveLink，解析失败静默忽略） ----
const onLink = (link) => {
  const r = resolveLink(link);
  if (r.kind === 'tab') {
    uni.switchTab({ url: r.url, fail: () => {} });
  } else if (r.kind === 'page') {
    uni.navigateTo({ url: r.url, fail: () => {} });
  } else if (r.kind === 'external') {
    // #ifdef H5
    window.location.href = r.url;
    // #endif
    // #ifndef H5
    uni.setClipboardData({
      data: r.url,
      success: () => uni.showToast({ title: '链接已复制', icon: 'none' }),
      fail: () => {},
    });
    // #endif
  }
};

const goSearch = () => uni.navigateTo({ url: '/subpkg/category/index', fail: () => {} });
const goGoods = (g) => {
  if (!g || g.id === undefined || g.id === null) return;
  uni.navigateTo({ url: '/subpkg/product/detail?id=' + g.id, fail: () => {} });
};

// #ifdef H5
// 桌面浏览器下让鼠标滚轮可横向滚动 goodsRow scroll 卡片行（事件委托，覆盖多个区块）
let wheelRoot = null;
let wheelHandler = null;
onMounted(() => {
  wheelRoot = document.querySelector('.pcd-blocks');
  if (!wheelRoot) return;
  wheelHandler = (e) => {
    if (!e.deltaY) return;
    const host = e.target && e.target.closest ? e.target.closest('.pcd-goods-scroll') : null;
    if (!host) return;
    const scroller = Array.from(host.querySelectorAll('div')).find((d) => d.scrollWidth > d.clientWidth + 1);
    if (scroller) {
      e.preventDefault();
      scroller.scrollLeft += e.deltaY;
    }
  };
  wheelRoot.addEventListener('wheel', wheelHandler, { passive: false });
});
onBeforeUnmount(() => {
  if (wheelRoot && wheelHandler) wheelRoot.removeEventListener('wheel', wheelHandler);
  wheelRoot = null;
  wheelHandler = null;
});
// #endif
</script>

<style lang="scss" scoped>
/* 桌面专属渲染器：尺寸一律 px；页面（.page-index）≥768 已有 24px 侧边距与 1200 限宽，
   容器只留纵向留白，宽度随内容列流体收缩（768–1199 不溢出） */
.pcd-blocks {
  padding: 16px 0;
}
.pcd-block {
  margin-bottom: 16px;
}

/* 轮播图（通栏） */
.pcd-banner {
  width: 100%;
  background: #e8e8e8;
  overflow: hidden;
}
.pcd-banner-img {
  width: 100%;
  height: 100%;
  display: block;
}

/* 搜索条（居中，最大宽 560px） */
.pcd-search-wrap {
  display: flex;
  justify-content: center;
}
.pcd-search {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 560px;
  padding: 12px 20px;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.pcd-search-icon {
  font-size: 16px;
  color: #999;
}
.pcd-search-text {
  font-size: 14px;
  color: #999;
}

/* 公告条（通栏单行省略） */
.pcd-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 10px;
}
.pcd-notice-icon {
  font-size: 16px;
  flex-shrink: 0;
}
.pcd-notice-text {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 宫格导航（图标卡片 56px） */
.pcd-navgrid {
  display: flex;
  flex-wrap: wrap;
  padding: 8px 0;
}
.pcd-navgrid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
}
.pcd-navgrid-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: #2979ff;
}
.pcd-navgrid-name {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

/* 标题栏（标题 20px / 更多右置） */
.pcd-titlebar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 16px 2px 8px;
}
.pcd-titlebar--center {
  justify-content: center;
  text-align: center;
}
.pcd-titlebar-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.pcd-titlebar-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
}
.pcd-titlebar-sub {
  font-size: 13px;
  color: #999;
}
.pcd-titlebar-more {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 14px;
  color: #999;
  flex-shrink: 0;
}

/* 图片广告（通栏） */
.pcd-imagead {
  width: 100%;
  display: block;
  background: #e8e8e8;
}

/* 服务卡片行 */
.pcd-goodsrow {
  padding: 8px 0;
}
.pcd-goodsrow-title {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 12px;
}
.pcd-goods-scroll {
  width: 100%;
}
/* #ifdef H5 */
.pcd-goods-scroll :deep(.uni-scroll-view::-webkit-scrollbar) {
  display: block;
  height: 4px;
}
.pcd-goods-scroll :deep(.uni-scroll-view::-webkit-scrollbar-thumb) {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 2px;
}
/* #endif */
.pcd-goods-scroll-inner {
  display: flex;
  width: max-content;
  padding: 2px 0 10px;
}
.pcd-goods-grid {
  display: grid;
  gap: 16px;
}
.pcd-goods-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
/* scroll 横滚卡片固定宽 280px（4.3） */
.pcd-goods-card--scroll {
  width: 280px;
  flex-shrink: 0;
  margin-right: 16px;
}
.pcd-goods-card--scroll:last-child {
  margin-right: 0;
}
.pcd-goods-cover {
  position: relative;
}
.pcd-goods-img {
  width: 100%;
  height: 160px;
  display: block;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
}
.pcd-goods-img--holder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: rgba(41, 121, 255, 0.45);
}
.pcd-goods-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(135deg, #ff6d00, #ff9100);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}
.pcd-goods-info {
  padding: 12px 14px 14px;
}
.pcd-goods-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 8px;
}
.pcd-goods-price {
  display: flex;
  align-items: baseline;
}
.pcd-price-symbol {
  color: #ff3d00;
  font-size: 13px;
  font-weight: 700;
}
.pcd-price-value {
  color: #ff3d00;
  font-size: 20px;
  font-weight: 700;
}

/* 富文本（白底卡片通栏） */
.pcd-richtext {
  background: #fff;
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.7;
  color: #333;
  overflow: hidden;
  box-sizing: border-box;
}
/* v-html 内图片不得撑破内容列 */
.pcd-richtext-body :deep(img) {
  max-width: 100%;
}

/* 分割线 / 占位块 */
.pcd-divider,
.pcd-blank {
  width: 100%;
}
</style>
