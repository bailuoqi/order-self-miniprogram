<template>
  <view class="page-category">
    <!-- 左侧分类（按软件/电子分组） -->
    <scroll-view scroll-y class="sidebar">
      <template v-for="group in groups" :key="group.key">
        <view class="sidebar-group">{{ group.title }}</view>
        <view
          v-for="cat in group.items"
          :key="cat.id"
          class="sidebar-item"
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
        <view class="product-item" v-for="p in products" :key="p.id" @click="goDetail(p)">
          <image class="p-img" :src="p.cover" mode="aspectFill" />
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

      <view v-if="!products.length" class="empty">
        <text>该品类暂无标准服务</text>
        <view class="btn-custom" @click="goCustom">发布自定义需求 ›</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useCategoryStore } from '@/store/category.js';
import { useProductStore } from '@/store/product.js';

const categoryStore = useCategoryStore();
const productStore = useProductStore();
const groups = ref([]);
const products = ref([]);
const activeId = ref(null);

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
  } catch (e) { console.log(e); }
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
.p-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.p-name { font-size: 28rpx; font-weight: 600; color: var(--text-main); display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; line-height: 1.4; }
.p-tags { display: flex; gap: 10rpx; }
.tag { font-size: 20rpx; color: var(--primary); background: var(--primary-light); padding: 4rpx 12rpx; border-radius: 6rpx; }
.p-footer { display: flex; justify-content: space-between; align-items: baseline; }
.p-price { .symbol { color: var(--danger); font-size: 24rpx; font-weight: 700; } .value { color: var(--danger); font-size: 34rpx; font-weight: 700; } .unit { color: var(--text-light); font-size: 22rpx; } }
.p-sold { font-size: 22rpx; color: var(--text-light); }
.empty { text-align: center; padding: 100rpx 0; color: var(--text-light); display: flex; flex-direction: column; gap: 20rpx; align-items: center; }
.btn-custom { color: var(--primary); font-size: 26rpx; font-weight: 600; }
</style>
