<template>
  <view class="page-index">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <view class="nav-brand">
          <text class="brand-name">{{ brandName }}</text>
        </view>
        <view class="nav-search" @click="goCategory">
          <i class="ri-search-2-line" style="font-size:28rpx;color:#999;" />
          <text class="search-placeholder">搜索软件定制或电子代做</text>
        </view>
        <view class="nav-avatar" @click="goMy">
          <image class="avatar-img" :src="userAvatar || '/static/icons/default-avatar.png'" mode="aspectFill" />
        </view>
      </view>
    </view>

    <!-- 品牌横幅 -->
    <view class="hero-card">
      <text class="hero-title">软件定制 · 电子代做</text>
      <text class="hero-sub">先报价后开工，付定金开做，交付满意结尾款</text>
      <view class="hero-steps">
        <text class="hero-step">下单</text><text class="hero-arrow">→</text>
        <text class="hero-step">报价</text><text class="hero-arrow">→</text>
        <text class="hero-step">定金</text><text class="hero-arrow">→</text>
        <text class="hero-step">制作</text><text class="hero-arrow">→</text>
        <text class="hero-step">交付</text><text class="hero-arrow">→</text>
        <text class="hero-step">尾款</text>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-entries">
      <view class="qe-card clickable" v-for="item in quickEntries" :key="item.key" @click="onEntry(item)">
        <view class="qe-icon-box" :style="{ background: item.bgColor }">
          <i :class="'ri-' + item.icon" :style="{ color: item.iconColor, fontSize: '48rpx' }" />
        </view>
        <text class="qe-label">{{ item.label }}</text>
      </view>
    </view>

    <!-- 公告栏 -->
    <view class="notice-bar" v-if="notice.text">
      <view class="notice-icon-box">
        <i class="ri-alarm-line" style="font-size:32rpx;color:#FF9100;" />
      </view>
      <view class="notice-content">
        <text class="notice-tag">公告</text>
        <text class="notice-text">{{ notice.text }}</text>
      </view>
    </view>

    <!-- 服务分类（软件定制 / 电子代做） -->
    <view class="section" v-for="group in categoryGroups" :key="group.key">
      <view class="section-header">
        <text class="section-title">{{ group.title }}</text>
        <view class="section-more clickable" @click="goCategory">
          <text>全部</text>
          <i class="ri-arrow-right-s-line" style="font-size:28rpx;" />
        </view>
      </view>
      <view class="category-grid">
        <view class="category-item clickable" v-for="cat in group.items" :key="cat.id" @click="goProductList(cat)">
          <view class="cat-icon-box">
            <i :class="'ri-' + (group.key === 'software' ? 'code-s-slash-line' : 'cpu-line')" style="font-size:44rpx;color:#2979FF;" />
          </view>
          <text class="cat-name">{{ cat.name }}</text>
        </view>
      </view>
    </view>

    <!-- 热门标准服务 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">
          <text class="section-emoji">🔥</text>热门标准服务
        </text>
        <view class="section-more clickable" @click="goProductList()">
          <text>更多</text>
          <i class="ri-arrow-right-s-line" style="font-size:28rpx;" />
        </view>
      </view>
      <scroll-view scroll-x class="product-scroll" :show-scrollbar="false" enhanced>
        <view class="product-scroll-inner">
          <view class="product-card hover-lift" v-for="product in hotProducts" :key="product.id" @click="goProductDetail(product)">
            <view class="product-img-wrap">
              <image class="product-img" :src="product.cover" mode="aspectFill" />
              <view class="product-badge" v-if="product.tags && product.tags[0]">{{ product.tags[0] }}</view>
            </view>
            <view class="product-info">
              <text class="product-name">{{ product.title }}</text>
              <view class="product-bottom">
                <view class="product-price">
                  <text class="price-symbol">¥</text>
                  <text class="price-value">{{ fmtPrice(product.price) }}</text>
                  <text class="price-unit">起</text>
                </view>
                <text class="product-sold">{{ product.sold_count || 0 }}单</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 客户评价精选 -->
    <view class="section" v-if="reviews.length">
      <view class="section-header">
        <text class="section-title">
          <text class="section-emoji">⭐</text>客户评价
        </text>
      </view>
      <view class="review-list">
        <view class="review-card" v-for="r in reviews" :key="r.id">
          <view class="review-head">
            <text class="review-name">{{ r.nickname }}</text>
            <view class="review-stars">
              <i v-for="s in 5" :key="s" class="ri-star-fill" style="font-size:22rpx;" :style="{ color: s <= r.score ? '#FF9100' : '#E0E0E0' }" />
            </view>
          </view>
          <text class="review-content">{{ r.content || '好评' }}</text>
          <text class="review-project">项目：{{ r.title }}</text>
        </view>
      </view>
    </view>

    <!-- 底部安全区 -->
    <view class="safe-bottom" />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useCategoryStore } from '@/store/category.js';
import { useProductStore } from '@/store/product.js';
import { useAuthStore } from '@/store/auth.js';
import { api } from '@/api/request.js';

const authStore = useAuthStore();
const categoryStore = useCategoryStore();
const productStore = useProductStore();

const statusBarHeight = ref(20);
const brandName = ref('定制接单');
const userAvatar = ref('');

const categoryGroups = ref([]);
const hotProducts = ref([]);
const reviews = ref([]);
const notice = ref({ text: '' });

const quickEntries = ref([
  { key: 'custom', icon: 'edit-box-line', label: '发布需求', bgColor: 'linear-gradient(135deg,#E3F2FD,#BBDEFB)', iconColor: '#1565C0' },
  { key: 'services', icon: 'file-list-3-line', label: '标准服务', bgColor: 'linear-gradient(135deg,#FFF3E0,#FFE0B2)', iconColor: '#E65100' },
  { key: 'join', icon: 'team-line', label: '加入我们', bgColor: 'linear-gradient(135deg,#E8F5E9,#C8E6C9)', iconColor: '#2E7D32' },
  { key: 'service', icon: 'customer-service-2-line', label: '客服', bgColor: 'linear-gradient(135deg,#F3E5F5,#E1BEE7)', iconColor: '#6A1B9A' },
]);

const fetchData = async () => {
  try {
    const [cats, hots, notices, revs] = await Promise.all([
      categoryStore.fetchAll().then(() => categoryStore.list),
      productStore.fetchHot().then(() => productStore.hotList),
      api.get('/cms/articles', { type: 'notice' }),
      api.get('/orders/reviews', { limit: 3 }).catch(() => []),
    ]);
    const list = cats || [];
    categoryGroups.value = [
      { key: 'software', title: '软件定制', items: list.filter(c => c.group === 'software') },
      { key: 'electronics', title: '电子代做', items: list.filter(c => c.group === 'electronics') },
    ].filter(g => g.items.length);
    hotProducts.value = hots || [];
    reviews.value = revs || [];
    if (notices && notices.length > 0) {
      notice.value = { text: notices[0].title };
    }
  } catch (e) {
    console.log('首页数据加载失败:', e);
  }
};

onShow(() => {
  if (authStore.userInfo) {
    userAvatar.value = authStore.userInfo.avatar || '';
  }
  fetchData();
});

// #ifdef H5
// 桌面浏览器预览时，让鼠标滚轮可以横向滚动热门服务
onMounted(() => {
  const root = document.querySelector('.product-scroll');
  if (!root) return;
  root.addEventListener(
    'wheel',
    (e) => {
      const scroller = Array.from(root.querySelectorAll('div')).find(
        (d) => d.scrollWidth > d.clientWidth + 1
      );
      if (scroller && e.deltaY) {
        e.preventDefault();
        scroller.scrollLeft += e.deltaY;
      }
    },
    { passive: false }
  );
});
// #endif

// 价格分转元
const fmtPrice = (fen) => {
  const yuan = (fen || 0) / 100;
  return yuan % 1 === 0 ? String(yuan) : yuan.toFixed(2);
};

// 导航
const goMy = () => uni.switchTab({ url: '/pages/my/index' });
const onEntry = (item) => {
  if (item.key === 'custom') uni.navigateTo({ url: '/subpkg/order/create-custom' });
  else if (item.key === 'services') uni.navigateTo({ url: '/subpkg/category/index' });
  else if (item.key === 'join') uni.navigateTo({ url: '/subpkg/my/join-us' });
  else uni.navigateTo({ url: '/subpkg/my/about' });
};
const goCategory = () => uni.navigateTo({ url: '/subpkg/category/index' });
const goProductList = (cat) => {
  const query = cat ? '?categoryId=' + cat.id + '&categoryName=' + cat.name : '';
  uni.navigateTo({ url: '/subpkg/product/list' + query });
};
const goProductDetail = (product) => uni.navigateTo({ url: '/subpkg/product/detail?id=' + product.id });
</script>

<style lang="scss" scoped>
.page-index {
  min-height: 100vh;
  background: #F5F6FA;
}

/* 导航栏 */
.nav-bar {
  background: linear-gradient(135deg, #2979FF 0%, #4A90D9 100%);
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-content {
  display: flex;
  align-items: center;
  padding: 20rpx 28rpx;
  gap: 20rpx;
}
.nav-brand {
  flex-shrink: 0;
}
.brand-name {
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
}
.nav-search {
  flex: 1;
  display: flex;
  align-items: center;
  height: 68rpx;
  border-radius: 34rpx;
  padding: 0 28rpx;
  gap: 12rpx;
  background: rgba(255,255,255,0.9);
}
.search-placeholder {
  color: #999;
  font-size: 24rpx;
}
.nav-avatar {
  flex-shrink: 0;
}
.avatar-img {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(255,255,255,0.4);
  background: #eee;
  display: block;
}

/* 品牌横幅 */
.hero-card {
  margin: 24rpx 24rpx 0;
  padding: 36rpx 32rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #2979FF, #1565C0);
  box-shadow: 0 8rpx 30rpx rgba(41,121,255,0.2);
}
.hero-title {
  color: #fff;
  font-size: 40rpx;
  font-weight: 700;
  display: block;
}
.hero-sub {
  color: rgba(255,255,255,0.8);
  font-size: 24rpx;
  display: block;
  margin-top: 12rpx;
}
.hero-steps {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 24rpx;
  flex-wrap: wrap;
}
.hero-step {
  background: rgba(255,255,255,0.18);
  color: #fff;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}
.hero-arrow {
  color: rgba(255,255,255,0.6);
  font-size: 22rpx;
}

/* 快捷入口 */
.quick-entries {
  display: flex;
  justify-content: space-between;
  padding: 30rpx 24rpx;
  gap: 16rpx;
}
.qe-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
  cursor: pointer;
}
.qe-icon-box {
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.08);
  transition: transform 0.2s;
}
.qe-card:active .qe-icon-box {
  transform: scale(0.92);
}
.qe-label {
  font-size: 24rpx;
  color: #333;
  font-weight: 500;
}

/* 公告 */
.notice-bar {
  display: flex;
  align-items: center;
  margin: 10rpx 24rpx;
  padding: 20rpx 24rpx;
  background: linear-gradient(135deg, #FFF8E1, #FFF3E0);
  border-radius: 16rpx;
  gap: 16rpx;
}
.notice-icon-box {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #FFF3E0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.notice-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
  overflow: hidden;
}
.notice-tag {
  font-size: 20rpx;
  color: #FF9100;
  background: #FFE0B2;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  font-weight: 600;
  flex-shrink: 0;
}
.notice-text {
  font-size: 24rpx;
  color: #E65100;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 通用区块 */
.section {
  margin: 36rpx 0 0;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24rpx;
  margin-bottom: 20rpx;
}
.section-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1A1A2E;
}
.section-emoji {
  margin-right: 8rpx;
}
.section-more {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: 26rpx;
  color: #999;
}

/* 分类网格 */
.category-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0 16rpx;
}
.category-item {
  width: 20%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 0 24rpx;
  gap: 12rpx;
}
.cat-icon-box {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.cat-name {
  font-size: 22rpx;
  color: #333;
  font-weight: 500;
}

/* 商品横向滚动 */
.product-scroll {
  width: 100%;
}
/* #ifdef H5 */
.product-scroll :deep(.uni-scroll-view::-webkit-scrollbar) {
  display: block;
  height: 8rpx;
}
.product-scroll :deep(.uni-scroll-view::-webkit-scrollbar-thumb) {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 4rpx;
}
/* #endif */
.product-scroll-inner {
  display: flex;
  width: max-content;
  padding: 4rpx 24rpx 16rpx;
}
.product-card {
  width: 340rpx;
  flex-shrink: 0;
  margin-right: 20rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);
}
.product-card:last-child {
  margin-right: 0;
}
.product-img-wrap {
  position: relative;
}
.product-img {
  width: 100%;
  height: 220rpx;
  display: block;
  background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
}
.product-badge {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  background: linear-gradient(135deg, #FF6D00, #FF9100);
  color: #fff;
  font-size: 20rpx;
  padding: 6rpx 14rpx;
  border-radius: 6rpx;
  font-weight: 600;
}
.product-info {
  padding: 20rpx 24rpx 24rpx;
}
.product-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1A1A2E;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  white-space: normal;
  margin-bottom: 16rpx;
}
.product-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.price-symbol {
  color: #FF3D00;
  font-size: 24rpx;
  font-weight: 700;
}
.price-value {
  color: #FF3D00;
  font-size: 38rpx;
  font-weight: 700;
}
.price-unit {
  color: #999;
  font-size: 20rpx;
}
.product-sold {
  font-size: 22rpx;
  color: #999;
}

/* 评价 */
.review-list {
  padding: 0 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.review-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);
}
.review-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.review-name {
  font-size: 26rpx;
  font-weight: 600;
}
.review-stars {
  display: flex;
  gap: 4rpx;
}
.review-content {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #444;
  line-height: 1.6;
}
.review-project {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #999;
}

.safe-bottom {
  height: calc(120rpx + env(safe-area-inset-bottom));
}

/* #ifdef H5 */
/* ==================== 桌面适配（B1–B3，仅 H5 编译，不进小程序包） ==================== */

/* B1：内容限宽 1200px 居中（页面背景与 page 同色，视觉上铺满全宽） */
.page-index {
  @include content-limit($content-max-page);
}

@include screen-tablet-up {
  /* B1：宽屏下导航职责移交 topWindow 顶栏，整体隐藏页内自定义导航栏
     （display:none 连同 sticky 占位与 statusBarHeight 内联留白一并消除） */
  .nav-bar {
    display: none;
  }

  /* B1：hero 横幅与快捷入口同一行（约 60% / 40%），其余区块通栏 */
  .page-index {
    display: grid;
    grid-template-columns: minmax(0, 6fr) minmax(0, 4fr);
    column-gap: 24px;
    align-content: start;
    padding: 0 24px;
  }
  .page-index > * {
    grid-column: 1 / -1;
    min-width: 0;
  }
  .hero-card {
    grid-column: 1;
    margin: 20px 0 0;
  }
  .quick-entries {
    grid-column: 2;
    margin: 20px 0 0;
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    align-items: center;
  }
  .notice-bar {
    margin: 16px 0 0;
  }

  /* 页面已有 24px 侧边距，区块内部左右留白归零对齐 */
  .section-header {
    padding: 0;
  }
  .category-grid {
    padding: 0;
  }
  .review-list {
    padding: 0;
  }

  /* B3：分类宫格宽屏改列数（8 列），避免图标间距过大（改列数不改结构） */
  .category-item {
    width: 12.5%;
  }

  /* B2：768–1199px 热门区保持横向滚动，仅左右边距与区块对齐 */
  .product-scroll-inner {
    padding: 4px 0 12px;
  }

  /* B3：客户评价宽屏卡片栅格（平板 2 列） */
  .review-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  /* 宽屏无底部 tabBar，压缩底部占位 */
  .safe-bottom {
    height: 32px;
  }
}

@include screen-desktop-up {
  /* B2：≥1200px 热门标准服务由横滚改为 4 列栅格（仅 CSS，不改数据逻辑；
     无横向溢出时页内滚轮补丁自动失效，滚轮恢复纵向滚动页面） */
  .product-scroll-inner {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    width: auto;
  }
  .product-card {
    width: auto;
    margin-right: 0;
  }
  .product-img {
    height: 150px;
  }

  /* B3：客户评价 3 列、分类宫格 10 列 */
  .review-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .category-item {
    width: 10%;
  }
}
/* #endif */
</style>
