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

    <!-- 结果条 -->
    <view class="result-meta" v-if="products.length">
      <text>共 {{ total }} 项服务，全部先报价后开工</text>
    </view>

    <!-- 商品列表 -->
    <view class="product-list">
      <view class="product-item hover-lift" v-for="p in products" :key="p.id" @click="goDetail(p)">
        <image v-if="p.cover" class="p-img" :src="p.cover" mode="aspectFill" />
        <view v-else class="p-img p-img--holder">
          <i :class="'ri-' + productIconName(p)" />
        </view>
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

    <!-- 列表尾部转化入口：标准服务覆盖不到的需求走自定义 -->
    <view class="custom-cta hover-lift" v-if="finished && products.length" @click="goCustom">
      <view class="cta-icon-box">
        <i class="ri-edit-box-line" style="font-size:40rpx;color:#2979FF;" />
      </view>
      <view class="cta-texts">
        <text class="cta-title">没找到合适的服务？</text>
        <text class="cta-desc">发布自定义需求，团队免费评估后报价，确认后才开工</text>
      </view>
      <i class="ri-arrow-right-s-line" style="font-size:32rpx;color:#bbb;" />
    </view>

    <view v-if="loading" class="loading">加载中...</view>
    <view v-if="finished && !products.length" class="empty">
      <view class="empty-icon-box">
        <i class="ri-inbox-line" style="font-size:56rpx;color:#2979FF;" />
      </view>
      <text class="empty-title">暂无相关服务</text>
      <text class="empty-desc">把需求直接告诉团队：先免费评估，在订单里报价，确认后才开工</text>
      <view class="btn-custom clickable" @click="goCustom">
        <i class="ri-edit-box-line" style="font-size:28rpx;" />
        <text>发布自定义需求</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onReachBottom } from '@dcloudio/uni-app';
import { useProductStore } from '@/store/product.js';
import { productIconName } from '@/common/browse.js';

const productStore = useProductStore();
const sortType = ref('default');
const priceOrder = ref(false);
const products = ref([]);
const total = ref(0);
const loading = ref(true);
const finished = ref(false);
let categoryId = null;
let page = 1;

onLoad((options) => {
  categoryId = options.categoryId || null;
  if (options.categoryName) uni.setNavigationBarTitle({ title: options.categoryName });
  loadProducts();
});

// 触底翻页：种子数据超过一页时也能全部浏览
onReachBottom(() => {
  if (!finished.value && !loading.value) {
    page += 1;
    loadProducts();
  }
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
    total.value = productStore.total || products.value.length;
    finished.value = productStore.list.length < 10;
  } catch (e) {
    console.log('加载失败:', e);
    finished.value = true;
  } finally {
    loading.value = false;
  }
};

const fmtPrice = (fen) => {
  const yuan = (fen || 0) / 100;
  return yuan % 1 === 0 ? String(yuan) : yuan.toFixed(2);
};

const goDetail = (p) => uni.navigateTo({ url: '/subpkg/product/detail?id=' + p.id });
const goCustom = () => uni.navigateTo({ url: '/subpkg/order/create-custom' });
</script>

<style lang="scss" scoped>
.page-product-list { min-height: 100vh; background: var(--bg-page); }
.filter-bar { display: flex; background: #fff; padding: 0 20rpx; border-bottom: 1rpx solid var(--border); position: sticky; top: 0; z-index: 10; }
.filter-item { flex: 1; text-align: center; padding: 24rpx 0; font-size: 26rpx; color: var(--text-secondary); }
.filter-item.active { color: var(--primary); font-weight: 700; }
.result-meta { padding: 20rpx 24rpx 0; font-size: 22rpx; color: var(--text-light); }
.product-list { padding: 20rpx; }
.product-item { display: flex; gap: 24rpx; padding: 24rpx; background: #fff; border-radius: var(--radius); margin-bottom: 16rpx; box-shadow: var(--shadow); }
.p-img { width: 200rpx; height: 200rpx; border-radius: 12rpx; flex-shrink: 0; background: linear-gradient(135deg,#E3F2FD,#BBDEFB); }
/* 无封面时用分类图标占位 */
.p-img--holder { display: flex; align-items: center; justify-content: center; font-size: 68rpx; color: rgba(41,121,255,0.45); }
.p-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.p-name { font-size: 28rpx; font-weight: 600; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; line-height: 1.4; }
.p-meta { display: flex; align-items: center; gap: 20rpx; font-size: 24rpx; color: var(--text-light); }
.p-rating { color: var(--warning); }
.p-footer { display: flex; justify-content: space-between; align-items: center; }
.p-price { .symbol { color: var(--danger); font-size: 24rpx; font-weight: 700; } .value { color: var(--danger); font-size: 36rpx; font-weight: 700; } .unit { color: var(--text-light); font-size: 22rpx; } }
.btn-buy { background: linear-gradient(135deg, #2979FF, #1565C0); color: #fff; font-size: 24rpx; padding: 12rpx 28rpx; border-radius: 30rpx; font-weight: 600; }
.loading { text-align: center; padding: 60rpx; color: var(--text-light); }

/* 列表尾部自定义需求引导卡 */
.custom-cta { display: flex; align-items: center; gap: 20rpx; padding: 26rpx 24rpx; background: #fff; border-radius: var(--radius); box-shadow: var(--shadow); margin: 0 20rpx 20rpx; }
.cta-icon-box { width: 76rpx; height: 76rpx; border-radius: 20rpx; background: var(--primary-light); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cta-texts { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6rpx; }
.cta-title { font-size: 28rpx; font-weight: 700; color: var(--text-main); }
.cta-desc { font-size: 22rpx; color: var(--text-light); line-height: 1.5; }

/* 空态：图标 + 说明 + 转化按钮 */
.empty { margin: 20rpx; padding: 80rpx 24rpx; background: #fff; border-radius: var(--radius); box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 12rpx; align-items: center; text-align: center; color: var(--text-light); }
.empty-icon-box { width: 112rpx; height: 112rpx; border-radius: 50%; background: linear-gradient(135deg,#E3F2FD,#BBDEFB); display: flex; align-items: center; justify-content: center; }
.empty-title { margin-top: 8rpx; font-size: 30rpx; font-weight: 700; color: var(--text-main); }
.empty-desc { font-size: 24rpx; color: var(--text-light); line-height: 1.6; max-width: 480rpx; }
.btn-custom { margin-top: 16rpx; display: flex; align-items: center; gap: 8rpx; background: linear-gradient(135deg, #2979FF, #1565C0); color: #fff; font-size: 26rpx; font-weight: 600; padding: 16rpx 40rpx; border-radius: 40rpx; }

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
.result-meta {
  @include content-limit($content-max-page);
}

@include screen-tablet-up {
  .filter-item {
    padding: 14px 0;
    font-size: 14px;
  }

  .result-meta {
    padding: 14px 24px 0;
    font-size: 12px;
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

  /* 引导卡与空态卡对齐内容列（列表侧边距 24px） */
  .custom-cta,
  .empty {
    width: calc(100% - 48px);
    max-width: $content-max-page - 48px;
    margin: 0 auto 16px;
    box-sizing: border-box;
  }
  .custom-cta {
    padding: 16px 20px;
  }
  .empty {
    padding: 48px 24px;
  }

  .loading {
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
