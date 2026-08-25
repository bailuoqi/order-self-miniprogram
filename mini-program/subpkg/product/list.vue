<template>
  <view class="page-product-list">
    <!-- 筛选栏 -->
    <view class="filter-bar">
      <view class="filter-item clickable" :class="{ active: sortType === 'default' }" @click="setSort('default')">综合排序</view>
      <view class="filter-item clickable" :class="{ active: sortType === 'sales' }" @click="setSort('sales')">销量优先</view>
      <view class="filter-item clickable" :class="{ active: sortType === 'price' }" @click="setSort('price')">
        价格 <text>{{ sortType === 'price' ? (priceOrder ? '↑' : '↓') : '' }}</text>
      </view>
      <view class="filter-item clickable" :class="{ active: sortType === 'rating' }" @click="setSort('rating')">评分优先</view>
    </view>

    <!-- 商品列表 -->
    <view class="product-list">
      <view class="product-item hover-lift" v-for="p in products" :key="p.id" @click="goDetail(p)">
        <image class="p-img" :src="p.cover || '/static/images/cover-default.png'" mode="aspectFill" />
        <view class="p-info">
          <text class="p-name text-ellipsis-2">{{ p.title }}</text>
          <view class="p-meta">
            <text class="p-sold" v-if="p.delivery_days">工期 {{ p.delivery_days }}</text>
            <text class="p-sold">已成交{{ p.sold_count || 0 }}单</text>
          </view>
          <view class="p-footer">
            <view class="p-price">
              <text class="symbol">¥</text>
              <text class="value">{{ fmtPrice(p.price) }}</text>
              <text class="unit">起</text>
            </view>
            <view class="btn-buy">需求报价</view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading">加载中...</view>
    <view v-if="finished && !products.length" class="empty">
      <view class="empty-icon-box">
        <i class="ri-inbox-line" style="font-size:64rpx;color:#C5CAD6;" />
      </view>
      <text>暂无相关服务</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useProductStore } from '@/store/product.js';

const productStore = useProductStore();
const sortType = ref('default');
const priceOrder = ref(false);
const products = ref([]);
const loading = ref(true);
const finished = ref(false);
let categoryId = null;
let page = 1;

onLoad((options) => {
  categoryId = options.categoryId || null;
  if (options.categoryName) uni.setNavigationBarTitle({ title: options.categoryName });
  loadProducts();
});

const setSort = (type) => {
  if (type === 'price') {
    priceOrder.value = sortType.value === 'price' ? !priceOrder.value : false;
  }
  sortType.value = type;
  page = 1;
  products.value = [];
  loadProducts();
};

const loadProducts = async () => {
  loading.value = true;
  try {
    const params = { page, pageSize: 10 };
    if (categoryId) params.category_id = categoryId;
    const res = await productStore.fetchList(params);
    if (page === 1) {
      products.value = productStore.list || [];
    } else {
      products.value = [...products.value, ...(productStore.list || [])];
    }
    finished.value = productStore.list.length < 10;
  } catch (e) {
    console.log('加载失败:', e);
  } finally {
    loading.value = false;
  }
};

const fmtPrice = (fen) => {
  const yuan = (fen || 0) / 100;
  return yuan % 1 === 0 ? String(yuan) : yuan.toFixed(2);
};

const goDetail = (p) => uni.navigateTo({ url: '/subpkg/product/detail?id=' + p.id });
</script>

<style lang="scss" scoped>
.page-product-list { min-height: 100vh; background: var(--bg-page); }
.filter-bar { display: flex; background: #fff; padding: 0 20rpx; border-bottom: 1rpx solid var(--border); position: sticky; top: 0; z-index: 10; }
.filter-item { flex: 1; text-align: center; padding: 24rpx 0; font-size: 26rpx; color: var(--text-secondary); }
.filter-item.active { color: var(--primary); font-weight: 700; }
.product-list { padding: 20rpx; }
.product-item { display: flex; gap: 24rpx; padding: 24rpx; background: #fff; border-radius: var(--radius); margin-bottom: 16rpx; box-shadow: var(--shadow); }
.p-img { width: 200rpx; height: 200rpx; border-radius: 12rpx; flex-shrink: 0; background: #f0f0f0; }
.p-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.p-name { font-size: 28rpx; font-weight: 600; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; line-height: 1.4; }
.p-meta { display: flex; align-items: center; gap: 20rpx; font-size: 24rpx; color: var(--text-light); }
.p-rating { color: var(--warning); }
.p-footer { display: flex; justify-content: space-between; align-items: center; }
.p-price { .symbol { color: var(--danger); font-size: 24rpx; font-weight: 700; } .value { color: var(--danger); font-size: 36rpx; font-weight: 700; } .unit { color: var(--text-light); font-size: 22rpx; } }
.btn-buy { background: linear-gradient(135deg, #2979FF, #1565C0); color: #fff; font-size: 24rpx; padding: 12rpx 28rpx; border-radius: 30rpx; font-weight: 600; }
.loading, .empty { text-align: center; padding: 60rpx; color: var(--text-light); }
.empty { display: flex; flex-direction: column; align-items: center; gap: 16rpx; padding: 100rpx 60rpx; }
.empty-icon-box { width: 128rpx; height: 128rpx; border-radius: 50%; background: #F0F2F7; display: flex; align-items: center; justify-content: center; }

/* #ifdef H5 */
/* ==================== 桌面适配（B5，仅 H5 编译，不进小程序包） ==================== */

/* 筛选栏与列表限宽 1200px 居中 */
.filter-bar {
  @include content-limit($content-max-page);
  /* H5 页头是固定定位、宽屏下还有 topWindow 顶栏，吸顶位置需让开两者
     （--window-top 只含页头 44px；--top-window-height 窄屏为 0px），
     否则滚动后筛选栏被页头/顶栏盖住不可见 */
  top: calc(var(--window-top) + var(--top-window-height, 0px));
}
.product-list {
  @include content-limit($content-max-page);
}

@include screen-tablet-up {
  .filter-item {
    padding: 14px 0;
    font-size: 14px;
  }

  /* 768px 起双列卡片栅格，grid 拉伸对齐同行卡片高度（规避 2 行截断导致的高低不平） */
  .product-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    padding: 16px 24px;
  }
  .product-item {
    margin-bottom: 0;
  }

  .loading,
  .empty {
    padding: 40px;
  }
}

@include screen-desktop-up {
  /* ≥1200px 三列 */
  .product-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
/* #endif */
</style>
