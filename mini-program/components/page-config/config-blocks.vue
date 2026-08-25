<!--
  首页装修配置区块渲染器（二期 C1 / U2）。
  输入为 normalizePageConfig 归一化后的 components（已滤掉未知类型与空组件）+ global。
  渲染 schemaVersion:1 基础子集 10 类：banner / search / notice / navGrid / titleBar /
  imageAd / goodsRow / richText / divider / blank；样式对齐编辑器画布视觉与现有首页卡片风格。
  只用 uni 组件与纯函数，双端可编译；H5 专属逻辑一律在 #ifdef H5 内。
-->
<template>
  <view class="pc-blocks">
    <view v-for="c in components" :key="c._id" class="pc-block" :style="wrapStyle(c.props)">
      <!-- 轮播图：autoplay 按 interval -->
      <swiper
        v-if="c.type === 'banner'"
        class="pcb-banner"
        :style="{ height: rpx(c.props.height, 160), borderRadius: rpx(c.props.radius, 8) }"
        :circular="bannerImages(c.props).length > 1"
        :autoplay="bannerImages(c.props).length > 1"
        :interval="bannerInterval(c.props)"
        :indicator-dots="!!c.props.dots && bannerImages(c.props).length > 1"
        indicator-color="rgba(255,255,255,0.5)"
        indicator-active-color="#ffffff"
      >
        <swiper-item v-for="(img, i) in bannerImages(c.props)" :key="i">
          <image class="pcb-banner-img" :src="img" mode="aspectFill" />
        </swiper-item>
      </swiper>

      <!-- 搜索条：点击进分类/服务检索页（hotWords 不消费） -->
      <view
        v-else-if="c.type === 'search'"
        class="pcb-search clickable"
        :style="{ background: c.props.bgColor || '#fff', borderRadius: rpx(c.props.radius, 20) }"
        @click="goSearch"
      >
        <i class="ri-search-line pcb-search-icon" />
        <text class="pcb-search-text">{{ c.props.placeholder || '搜索' }}</text>
      </view>

      <!-- 公告条：单行省略（speed 不消费，不做跑马灯） -->
      <view
        v-else-if="c.type === 'notice'"
        class="pcb-notice"
        :style="{ background: c.props.bgColor || '#fff7e6', color: c.props.color || '#fa8c16' }"
        @click="onLink(c.props.link)"
      >
        <i class="pcb-notice-icon" :class="icon(c.props.ico || 'ri-volume-up-line')" />
        <text class="pcb-notice-text" :style="{ color: c.props.color || '#fa8c16' }">{{ c.props.text }}</text>
      </view>

      <!-- 宫格导航：图标走白名单回退 -->
      <view v-else-if="c.type === 'navGrid'" class="pcb-navgrid">
        <view
          v-for="(item, i) in c.props.items"
          :key="i"
          class="pcb-navgrid-item clickable"
          :style="{ width: 100 / gridColumns(c.props, 4) + '%', padding: rpx(c.props.gutter, 8) }"
          @click="onLink(item.link)"
        >
          <view class="pcb-navgrid-icon"><i :class="icon(item.icon)" /></view>
          <text class="pcb-navgrid-name">{{ item.name }}</text>
        </view>
      </view>

      <!-- 区块标题栏 -->
      <view
        v-else-if="c.type === 'titleBar'"
        class="pcb-titlebar"
        :class="{ 'pcb-titlebar--center': c.props.align === 'center' }"
      >
        <view class="pcb-titlebar-left">
          <text class="pcb-titlebar-title">{{ c.props.title }}</text>
          <text v-if="c.props.subtitle" class="pcb-titlebar-sub">{{ c.props.subtitle }}</text>
        </view>
        <view v-if="c.props.moreText" class="pcb-titlebar-more clickable" @click="onLink(c.props.moreLink)">
          <text>{{ c.props.moreText }}</text>
          <i class="ri-arrow-right-s-line" />
        </view>
      </view>

      <!-- 图片广告：宽度恒 100%（width 不消费） -->
      <image
        v-else-if="c.type === 'imageAd'"
        class="pcb-imagead clickable"
        :src="c.props.src"
        mode="aspectFill"
        :style="{ height: rpx(c.props.height, 120), borderRadius: rpx(c.props.radius, 8) }"
        @click="onLink(c.props.link)"
      />

      <!-- 服务卡片行：scroll 横滚 / grid 栅格；价格单位分 ÷100 显示 -->
      <view v-else-if="c.type === 'goodsRow'" class="pcb-goodsrow">
        <text v-if="c.props.title" class="pcb-goodsrow-title">{{ c.props.title }}</text>
        <scroll-view
          v-if="(c.props.layout || 'scroll') === 'scroll'"
          scroll-x
          class="pcb-goods-scroll"
          :show-scrollbar="false"
          enhanced
        >
          <view class="pcb-goods-scroll-inner">
            <view
              v-for="g in c.props.goods"
              :key="g.id"
              class="pcb-goods-card hover-lift clickable"
              @click="goGoods(g)"
            >
              <view class="pcb-goods-cover">
                <image v-if="g.cover" class="pcb-goods-img" :src="g.cover" mode="aspectFill" />
                <view v-else class="pcb-goods-img pcb-goods-img--holder"><i class="ri-shopping-bag-3-line" /></view>
                <view v-if="c.props.showBadge" class="pcb-goods-badge">荐</view>
              </view>
              <view class="pcb-goods-info">
                <text class="pcb-goods-name">{{ g.title }}</text>
                <view class="pcb-goods-price">
                  <text class="pcb-price-symbol">¥</text>
                  <text class="pcb-price-value">{{ price(g.price) }}</text>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
        <view
          v-else
          class="pcb-goods-grid"
          :style="{ gridTemplateColumns: 'repeat(' + gridColumns(c.props, 2) + ', minmax(0, 1fr))' }"
        >
          <view
            v-for="g in c.props.goods"
            :key="g.id"
            class="pcb-goods-card pcb-goods-card--grid hover-lift clickable"
            @click="goGoods(g)"
          >
            <view class="pcb-goods-cover">
              <image v-if="g.cover" class="pcb-goods-img" :src="g.cover" mode="aspectFill" />
              <view v-else class="pcb-goods-img pcb-goods-img--holder"><i class="ri-shopping-bag-3-line" /></view>
              <view v-if="c.props.showBadge" class="pcb-goods-badge">荐</view>
            </view>
            <view class="pcb-goods-info">
              <text class="pcb-goods-name">{{ g.title }}</text>
              <view class="pcb-goods-price">
                <text class="pcb-price-symbol">¥</text>
                <text class="pcb-price-value">{{ price(g.price) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 富文本：H5 用 v-html，小程序用 rich-text（管理员输入、后台已鉴权，客户端仅渲染） -->
      <view v-else-if="c.type === 'richText'" class="pcb-richtext" :style="{ padding: rpx(c.props.padding, 12) }">
        <!-- #ifdef H5 -->
        <view class="pcb-richtext-body" v-html="c.props.content" />
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <rich-text class="pcb-richtext-body" :nodes="c.props.content" />
        <!-- #endif -->
      </view>

      <!-- 分割线 -->
      <view
        v-else-if="c.type === 'divider'"
        class="pcb-divider"
        :style="{ height: rpx(c.props.height, 1), background: c.props.color || '#eee', margin: marginRpx(c.props.margin) }"
      />

      <!-- 占位块 -->
      <view
        v-else-if="c.type === 'blank'"
        class="pcb-blank"
        :style="{ height: rpx(c.props.height, 10), background: c.props.bgColor || 'transparent' }"
      />

      <!-- 归一化已滤掉未知类型；此处不再兜底渲染 -->
    </view>
  </view>
</template>

<script setup>
// #ifdef H5
import { onMounted, onBeforeUnmount } from 'vue';
// #endif
import { pxToRpx, pxStyleToRpx, fmtPriceFen, resolveLink, safeIcon } from '@/common/page-config.js';

defineProps({
  components: { type: Array, default: () => [] },
  global: { type: Object, default: () => ({}) },
});

// ---- 模板辅助（纯函数封装，px→rpx×2 / 分→元 / 图标白名单） ----
const rpx = (v, fb) => pxToRpx(v, fb) + 'rpx';
const icon = safeIcon;
const price = fmtPriceFen;

const wrapStyle = (p) => {
  const s = {};
  if (p && p.marginTop) s.marginTop = rpx(p.marginTop);
  if (p && p.marginBottom) s.marginBottom = rpx(p.marginBottom);
  return s;
};

const bannerImages = (p) =>
  (Array.isArray(p.images) ? p.images : []).filter((img) => typeof img === 'string' && img.trim());

const bannerInterval = (p) => Math.max(1000, Number(p.interval) || 3000);

const gridColumns = (p, fb) => {
  const n = Math.floor(Number(p.columns));
  return Number.isFinite(n) && n > 0 ? n : fb;
};

const marginRpx = (val) => pxStyleToRpx(val === undefined || val === null || val === '' ? '12px 0' : val);

// ---- 链接解析执行（5.3）：解析失败静默忽略 ----
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
// 桌面浏览器 768–1199px 下让鼠标滚轮可横向滚动服务卡片行（事件委托，覆盖多个 goodsRow）
let wheelRoot = null;
let wheelHandler = null;
onMounted(() => {
  wheelRoot = document.querySelector('.pc-blocks');
  if (!wheelRoot) return;
  wheelHandler = (e) => {
    if (!e.deltaY) return;
    const host = e.target && e.target.closest ? e.target.closest('.pcb-goods-scroll') : null;
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
/* 容器留白对齐画布 s-body（8px→16rpx），区块间距对齐 s-comp（6px→12rpx） */
.pc-blocks {
  padding: 16rpx;
}
.pc-block {
  margin-bottom: 12rpx;
}

/* 轮播图 */
.pcb-banner {
  width: 100%;
  background: #e8e8e8;
  overflow: hidden;
}
.pcb-banner-img {
  width: 100%;
  height: 100%;
  display: block;
}

/* 搜索条 */
.pcb-search {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}
.pcb-search-icon {
  font-size: 28rpx;
  color: #999;
}
.pcb-search-text {
  font-size: 26rpx;
  color: #999;
}

/* 公告条（单行省略） */
.pcb-notice {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 28rpx;
  border-radius: 12rpx;
}
.pcb-notice-icon {
  font-size: 30rpx;
  flex-shrink: 0;
}
.pcb-notice-text {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 宫格导航 */
.pcb-navgrid {
  display: flex;
  flex-wrap: wrap;
  padding: 16rpx 0;
}
.pcb-navgrid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  box-sizing: border-box;
}
.pcb-navgrid-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #2979ff;
}
.pcb-navgrid-name {
  font-size: 22rpx;
  color: #333;
  font-weight: 500;
}

/* 标题栏 */
.pcb-titlebar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 24rpx 4rpx 12rpx;
}
.pcb-titlebar--center {
  justify-content: center;
  text-align: center;
}
.pcb-titlebar-left {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}
.pcb-titlebar-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1a1a2e;
}
.pcb-titlebar-sub {
  font-size: 24rpx;
  color: #999;
}
.pcb-titlebar-more {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
}

/* 图片广告 */
.pcb-imagead {
  width: 100%;
  display: block;
  background: #e8e8e8;
}

/* 服务卡片行 */
.pcb-goodsrow {
  padding: 12rpx 0;
}
.pcb-goodsrow-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 16rpx;
}
.pcb-goods-scroll {
  width: 100%;
}
/* #ifdef H5 */
.pcb-goods-scroll :deep(.uni-scroll-view::-webkit-scrollbar) {
  display: block;
  height: 8rpx;
}
.pcb-goods-scroll :deep(.uni-scroll-view::-webkit-scrollbar-thumb) {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 4rpx;
}
/* #endif */
.pcb-goods-scroll-inner {
  display: flex;
  width: max-content;
  padding: 4rpx 0 12rpx;
}
.pcb-goods-grid {
  display: grid;
  gap: 16rpx;
}
.pcb-goods-card {
  width: 260rpx;
  flex-shrink: 0;
  margin-right: 16rpx;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}
.pcb-goods-card:last-child {
  margin-right: 0;
}
.pcb-goods-card--grid {
  width: auto;
  margin-right: 0;
}
.pcb-goods-cover {
  position: relative;
}
.pcb-goods-img {
  width: 100%;
  height: 180rpx;
  display: block;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
}
.pcb-goods-img--holder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  color: rgba(41, 121, 255, 0.45);
}
.pcb-goods-badge {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  background: linear-gradient(135deg, #ff6d00, #ff9100);
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  font-weight: 600;
}
.pcb-goods-info {
  padding: 16rpx 20rpx 20rpx;
}
.pcb-goods-name {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 12rpx;
}
.pcb-goods-price {
  display: flex;
  align-items: baseline;
}
.pcb-price-symbol {
  color: #ff3d00;
  font-size: 22rpx;
  font-weight: 700;
}
.pcb-price-value {
  color: #ff3d00;
  font-size: 34rpx;
  font-weight: 700;
}

/* 富文本 */
.pcb-richtext {
  background: #fff;
  border-radius: 16rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #333;
  overflow: hidden;
}

/* 分割线 / 占位块 */
.pcb-divider,
.pcb-blank {
  width: 100%;
}

/* #ifdef H5 */
/* ==================== 桌面宽屏（U4，仅 H5 编译） ==================== */
@include screen-tablet-up {
  /* 页面容器（.page-index）在 ≥768 已有 24px 侧边距，区块容器左右留白归零对齐 */
  .pc-blocks {
    padding: 16rpx 0;
  }
}

@include screen-desktop-up {
  /* ≥1200px：goodsRow scroll 布局自动转 4 列栅格（与一期热门服务处理一致，仅 CSS；
     无横向溢出时滚轮补丁自动失效，滚轮恢复纵向滚动页面） */
  .pcb-goods-scroll-inner {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    width: auto;
  }
  .pcb-goods-card {
    width: auto;
    margin-right: 0;
  }
  .pcb-goods-img {
    height: 150px;
  }
}
/* #endif */
</style>
