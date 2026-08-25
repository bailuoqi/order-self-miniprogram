<template>
  <view class="page-category">
    <!-- 左侧分类（按软件/电子分组） -->
    <scroll-view scroll-y class="sidebar">
      <template v-for="group in groups" :key="group.key">
        <view class="sidebar-group">{{ group.title }}</view>
        <view
          v-for="cat in group.items"
          :key="cat.id"
          class="sidebar-item clickable"
          :class="{ active: activeId === cat.id }"
          @click="switchCategory(cat)"
        >
          <text>{{ cat.name }}</text>
        </view>
      </template>
    </scroll-view>

    <!-- 右侧服务列表 -->
    <scroll-view scroll-y class="main-content">
      <view class="product-list">
        <view class="product-item hover-lift" v-for="p in products" :key="p.id" @click="goDetail(p)">
          <image v-if="p.cover" class="p-img" :src="p.cover" mode="aspectFill" />
          <view v-else class="p-img p-img--holder">
            <i :class="'ri-' + productIconName(p)" />
          </view>
          <view class="p-info">
            <text class="p-name text-ellipsis-2">{{ p.title }}</text>
            <view class="p-tags">
              <text class="tag" v-for="t in (p.tags || []).slice(0, 2)" :key="t">{{ t }}</text>
            </view>
            <view class="p-footer">
              <view class="p-price">
                <text class="symbol">¥</text>
                <text class="value">{{ fmtPrice(p.price) }}</text>
                <text class="unit">起</text>
              </view>
              <text class="p-sold">已成交{{ p.sold_count || 0 }}单</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 列表尾部转化入口：标准服务覆盖不到的需求走自定义 -->
      <view class="custom-cta hover-lift" v-if="products.length" @click="goCustom">
        <view class="cta-icon-box">
          <i class="ri-edit-box-line" style="font-size:40rpx;color:#2979FF;" />
        </view>
        <view class="cta-texts">
          <text class="cta-title">没找到合适的服务？</text>
          <text class="cta-desc">发布自定义需求，团队免费评估后报价，确认后才开工</text>
        </view>
        <i class="ri-arrow-right-s-line" style="font-size:32rpx;color:#bbb;" />
      </view>

      <view v-if="loaded && !products.length" class="empty">
        <view class="empty-icon-box">
          <i class="ri-inbox-line" style="font-size:56rpx;color:#2979FF;" />
        </view>
        <text class="empty-title">该品类暂无标准服务</text>
        <text class="empty-desc">把需求直接告诉团队：先免费评估，在订单里报价，确认后才开工</text>
        <view class="btn-custom clickable" @click="goCustom">
          <i class="ri-edit-box-line" style="font-size:28rpx;" />
          <text>发布自定义需求</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useCategoryStore } from '@/store/category.js';
import { useProductStore } from '@/store/product.js';
import { productIconName } from '@/common/browse.js';

const categoryStore = useCategoryStore();
const productStore = useProductStore();
const groups = ref([]);
const products = ref([]);
const activeId = ref(null);
// 首次数据返回前不渲染空态，避免加载闪烁
const loaded = ref(false);

onShow(async () => {
  try {
    await categoryStore.fetchAll();
    const list = categoryStore.list || [];
    groups.value = [
      { key: 'software', title: '软件定制', items: list.filter(c => c.group === 'software') },
      { key: 'electronics', title: '电子代做', items: list.filter(c => c.group === 'electronics') },
    ].filter(g => g.items.length);
    if (!activeId.value && groups.value.length && groups.value[0].items.length) {
      await switchCategory(groups.value[0].items[0]);
    }
  } catch (e) { console.log(e); } finally { loaded.value = true; }
});

const switchCategory = async (cat) => {
  activeId.value = cat.id;
  try {
    await productStore.fetchList({ category_id: cat.id, page: 1, pageSize: 20 });
    products.value = productStore.list || [];
  } catch (e) { console.log(e); }
};

const fmtPrice = (fen) => {
  const yuan = (fen || 0) / 100;
  return yuan % 1 === 0 ? String(yuan) : yuan.toFixed(2);
};

const goDetail = (p) => uni.navigateTo({ url: '/subpkg/product/detail?id=' + p.id });
const goCustom = () => uni.navigateTo({ url: '/subpkg/order/create-custom' });
</script>

<style lang="scss" scoped>
.page-category { display: flex; height: calc(100vh - var(--window-top)); }
.sidebar { width: 200rpx; background: #fff; flex-shrink: 0; }
.sidebar-group { padding: 24rpx 20rpx 12rpx; font-size: 22rpx; color: var(--text-light); font-weight: 600; }
.sidebar-item { padding: 26rpx 20rpx; font-size: 26rpx; color: var(--text-secondary); text-align: center; position: relative; }
.sidebar-item.active { color: var(--primary); font-weight: 700; background: var(--bg-page); }
.sidebar-item.active::before { content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 6rpx; height: 36rpx; background: var(--primary); border-radius: 0 4rpx 4rpx 0; }
.main-content { flex: 1; padding: 20rpx; box-sizing: border-box; }
.product-item { display: flex; gap: 24rpx; padding: 24rpx; background: #fff; border-radius: var(--radius); margin-bottom: 16rpx; box-shadow: var(--shadow); }
.p-img { width: 160rpx; height: 160rpx; border-radius: 12rpx; flex-shrink: 0; background: linear-gradient(135deg,#E3F2FD,#BBDEFB); }
/* 无封面时用分类图标占位 */
.p-img--holder { display: flex; align-items: center; justify-content: center; font-size: 60rpx; color: rgba(41,121,255,0.45); }
.p-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.p-name { font-size: 28rpx; font-weight: 600; color: var(--text-main); display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; line-height: 1.4; }
.p-tags { display: flex; gap: 10rpx; }
.tag { font-size: 20rpx; color: var(--primary); background: var(--primary-light); padding: 4rpx 12rpx; border-radius: 6rpx; }
.p-footer { display: flex; justify-content: space-between; align-items: baseline; }
.p-price { .symbol { color: var(--danger); font-size: 24rpx; font-weight: 700; } .value { color: var(--danger); font-size: 34rpx; font-weight: 700; } .unit { color: var(--text-light); font-size: 22rpx; } }
.p-sold { font-size: 22rpx; color: var(--text-light); }
/* 列表尾部自定义需求引导卡 */
.custom-cta { display: flex; align-items: center; gap: 20rpx; padding: 26rpx 24rpx; background: #fff; border-radius: var(--radius); box-shadow: var(--shadow); margin-bottom: 16rpx; }
.cta-icon-box { width: 76rpx; height: 76rpx; border-radius: 20rpx; background: var(--primary-light); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cta-texts { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6rpx; }
.cta-title { font-size: 28rpx; font-weight: 700; color: var(--text-main); }
.cta-desc { font-size: 22rpx; color: var(--text-light); line-height: 1.5; }

/* 空态：图标 + 说明 + 转化按钮 */
.empty { text-align: center; padding: 80rpx 24rpx; color: var(--text-light); display: flex; flex-direction: column; gap: 12rpx; align-items: center; background: #fff; border-radius: var(--radius); box-shadow: var(--shadow); }
.empty-icon-box { width: 112rpx; height: 112rpx; border-radius: 50%; background: linear-gradient(135deg,#E3F2FD,#BBDEFB); display: flex; align-items: center; justify-content: center; }
.empty-title { margin-top: 8rpx; font-size: 30rpx; font-weight: 700; color: var(--text-main); }
.empty-desc { font-size: 24rpx; color: var(--text-light); line-height: 1.6; max-width: 480rpx; }
.btn-custom { margin-top: 16rpx; display: flex; align-items: center; gap: 8rpx; background: linear-gradient(135deg, #2979FF, #1565C0); color: #fff; font-size: 26rpx; font-weight: 600; padding: 16rpx 40rpx; border-radius: 40rpx; }

/* #ifdef H5 */
/* ==================== 桌面适配（B4，仅 H5 编译，不进小程序包） ==================== */

/* 整体限宽 1200px 居中 */
.page-category {
  @include content-limit($content-max-page);
}

@include screen-tablet-up {
  /* 宽屏下页面被框架放进已扣除 topWindow 高度的 uni-content 容器，而 --window-top 只含
     页头 44px，需同时扣掉 --top-window-height（uni-h5 注入在 :root），否则整页高出 61px、
     出现外层滚动条（与 pages/order/list.vue 同一处理） */
  .page-category {
    height: calc(100vh - var(--window-top) - var(--top-window-height, 0px));
  }

  /* 左侧分类栏加宽至 220px，字号随桌面可读性微调 */
  .sidebar {
    width: 220px;
  }
  .sidebar-group {
    padding: 18px 12px 8px;
    font-size: 13px;
  }
  .sidebar-item {
    padding: 14px 12px;
    font-size: 14px;
  }
  .main-content {
    padding: 16px;
  }
  .custom-cta {
    padding: 16px 20px;
  }
  .empty {
    padding: 48px 24px;
  }
}

@include screen-desktop-up {
  /* ≥1200px 右侧服务卡双列（grid 拉伸对齐同行卡片高度） */
  .product-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .product-item {
    margin-bottom: 0;
  }
}
/* #endif */
</style>
