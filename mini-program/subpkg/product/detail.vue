<template>
  <view class="page-detail" v-if="product">
    <!-- 封面 -->
    <view class="img-wrap">
      <image v-if="product.cover" class="cover-img" :src="product.cover" mode="aspectFill" />
      <view v-else class="cover-img cover-img--holder">
        <i :class="'ri-' + productIconName(product)" />
        <text class="cover-holder-text">{{ product.category ? product.category.name : '定制服务' }}</text>
      </view>
    </view>

    <!-- 价格&标题 -->
    <view class="price-card">
      <view class="price-row">
        <view class="price">
          <text class="symbol">¥</text><text class="value">{{ fmtPrice(product.price) }}</text><text class="from"> 起</text>
        </view>
        <text class="origin-price" v-if="product.original_price">¥{{ fmtPrice(product.original_price) }}</text>
      </view>
      <text class="title">{{ product.title }}</text>
      <view class="meta-row">
        <text class="meta-item" v-if="product.delivery_days">参考工期：{{ product.delivery_days }}</text>
        <view class="meta-divider" v-if="product.delivery_days" />
        <text class="meta-item">已成交 {{ product.sold_count || 0 }} 单</text>
      </view>
      <view class="tags" v-if="product.tags && product.tags.length">
        <text class="tag" v-for="t in product.tags" :key="t">
          <i class="ri-check-line" style="font-size:20rpx;" />{{ t }}
        </text>
      </view>
    </view>

    <!-- 流程说明 -->
    <view class="flow-card">
      <view class="card-title">
        <i class="ri-route-line" style="font-size:34rpx;color:#2979FF;" />
        <text>下单流程</text>
      </view>
      <view class="flow-steps">
        <text class="flow-step">提交需求</text><text class="flow-arrow">→</text>
        <text class="flow-step">团队报价</text><text class="flow-arrow">→</text>
        <text class="flow-step">付定金开工</text><text class="flow-arrow">→</text>
        <text class="flow-step">交付结尾款</text>
      </view>
      <text class="flow-note">页面价格为参考起价，实际以团队按需求报价为准</text>
    </view>

    <!-- 服务保障 -->
    <view class="guarantee-card">
      <view class="card-title">
        <i class="ri-shield-check-line" style="font-size:34rpx;color:#2979FF;" />
        <text>服务保障</text>
      </view>
      <view class="guarantee-grid">
        <view class="g-item" v-for="g in guarantees" :key="g.title">
          <view class="g-icon-box">
            <i :class="'ri-' + g.icon" style="font-size:36rpx;color:#2979FF;" />
          </view>
          <view class="g-texts">
            <text class="g-title">{{ g.title }}</text>
            <text class="g-desc">{{ g.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 服务说明 -->
    <view class="desc-card">
      <view class="card-title">
        <i class="ri-article-line" style="font-size:34rpx;color:#2979FF;" />
        <text>服务说明</text>
      </view>
      <view class="desc-content">
        <text>{{ product.description }}</text>
      </view>
    </view>

    <!-- 客户评价 -->
    <view class="review-card" v-if="reviews.length">
      <view class="card-title">
        <i class="ri-chat-3-line" style="font-size:34rpx;color:#2979FF;" />
        <text>客户评价（{{ reviews.length }}）</text>
      </view>
      <view class="review-item" v-for="r in reviews" :key="r.id">
        <view class="reviewer">
          <view class="rv-info">
            <text class="rv-name">{{ r.nickname }}</text>
            <view class="rv-stars">
              <i v-for="s in 5" :key="s" class="ri-star-fill" style="font-size:22rpx;" :style="{ color: s <= r.score ? '#FF9100' : '#E0E0E0' }" />
            </view>
          </view>
          <text class="rv-date">{{ fmtDate(r.reviewed_at) }}</text>
        </view>
        <text class="rv-content">{{ r.content || '好评' }}</text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="bar-left">
        <view class="bar-action clickable" @click="goConsult">
          <i class="ri-customer-service-2-line" style="font-size:40rpx;color:#666;" />
          <text class="bar-text">客服</text>
        </view>
      </view>
      <button class="btn-buy" @click="buyNow">提交需求，等待报价</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useProductStore } from '@/store/product.js';
import { useAuthStore } from '@/store/auth.js';
import { api } from '@/api/request.js';
import { productIconName, GUARANTEES } from '@/common/browse.js';

const productStore = useProductStore();
const authStore = useAuthStore();
const product = ref(null);
const reviews = ref([]);
const guarantees = GUARANTEES;

onLoad(async (options) => {
  try {
    await productStore.fetchDetail(options.id);
    product.value = productStore.current;
    reviews.value = await api.get('/orders/reviews', { product_id: options.id, limit: 10 }).catch(() => []);
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' });
  }
});

const fmtPrice = (fen) => {
  const yuan = (fen || 0) / 100;
  return yuan % 1 === 0 ? String(yuan) : yuan.toFixed(2);
};
const fmtDate = (d) => (d ? String(d).replace('T', ' ').slice(0, 10) : '');

const buyNow = () => {
  if (!authStore.isLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: '/subpkg/order/create?productId=' + product.value.id });
};

const goConsult = () => uni.navigateTo({ url: '/subpkg/my/about' });
</script>

<style lang="scss" scoped>
.page-detail {
  background: #F5F6FA;
  padding-bottom: 140rpx;
  min-height: 100vh;
}

.img-wrap { position: relative; }
.cover-img { width: 750rpx; height: 420rpx; display: block; background: linear-gradient(135deg, #E3F2FD, #BBDEFB); }
/* 无封面时用分类图标 + 分类名占位 */
.cover-img--holder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; font-size: 120rpx; color: rgba(41,121,255,0.4); }
.cover-holder-text { font-size: 26rpx; color: rgba(21,101,192,0.55); font-weight: 600; letter-spacing: 2rpx; }

.price-card {
  background: #fff;
  margin: -24rpx 24rpx 20rpx;
  padding: 28rpx;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 30rpx rgba(0,0,0,0.08);
  position: relative;
  z-index: 1;
}
.price-row { display: flex; align-items: baseline; gap: 14rpx; }
.price {
  .symbol { color: #FF3D00; font-size: 36rpx; font-weight: 700; }
  .value { color: #FF3D00; font-size: 56rpx; font-weight: 700; }
  .from { color: #999; font-size: 24rpx; }
}
.origin-price { color: #bbb; font-size: 28rpx; text-decoration: line-through; }
.title { font-size: 34rpx; font-weight: 700; line-height: 1.5; display: block; margin-top: 16rpx; }
.meta-row { display: flex; align-items: center; gap: 16rpx; margin-top: 14rpx; }
.meta-item { font-size: 24rpx; color: #666; }
.meta-divider { width: 2rpx; height: 20rpx; background: #e0e0e0; }
.tags { display: flex; gap: 14rpx; margin-top: 18rpx; padding-top: 18rpx; border-top: 1rpx solid #f0f0f0; }
.tag { font-size: 22rpx; color: #1565C0; background: #E3F2FD; padding: 6rpx 16rpx; border-radius: 8rpx; display: flex; align-items: center; gap: 4rpx; }

.flow-card, .guarantee-card, .desc-card, .review-card { background: #fff; margin: 0 24rpx 16rpx; padding: 28rpx; border-radius: 20rpx; }
.card-title { display: flex; align-items: center; gap: 12rpx; font-size: 30rpx; font-weight: 700; margin-bottom: 20rpx; }
.flow-steps { display: flex; align-items: center; flex-wrap: wrap; gap: 8rpx; }
.flow-step { background: #E3F2FD; color: #1565C0; font-size: 24rpx; padding: 10rpx 20rpx; border-radius: 10rpx; font-weight: 600; }
.flow-arrow { color: #999; font-size: 24rpx; }
.flow-note { display: block; margin-top: 16rpx; font-size: 22rpx; color: #999; }
.desc-content { font-size: 28rpx; line-height: 1.8; color: #666; white-space: pre-line; }

/* 服务保障 */
.guarantee-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20rpx 16rpx; }
.g-item { display: flex; align-items: flex-start; gap: 14rpx; }
.g-icon-box { width: 60rpx; height: 60rpx; border-radius: 14rpx; background: #E3F2FD; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.g-texts { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4rpx; }
.g-title { font-size: 26rpx; font-weight: 700; color: #1A1A2E; }
.g-desc { font-size: 22rpx; color: #999; line-height: 1.5; }

.review-item { padding: 24rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.review-item:last-child { border-bottom: none; padding-bottom: 0; }
.reviewer { display: flex; align-items: center; justify-content: space-between; }
.rv-info { flex: 1; }
.rv-name { font-size: 26rpx; font-weight: 600; display: block; }
.rv-stars { display: flex; gap: 4rpx; margin-top: 4rpx; }
.rv-date { font-size: 22rpx; color: #bbb; }
.rv-content { margin-top: 16rpx; font-size: 26rpx; color: #444; line-height: 1.6; display: block; }

.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0; background: #fff;
  display: flex; align-items: center; padding: 14rpx 28rpx;
  padding-bottom: calc(14rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.06); z-index: 50;
}
.bar-left { display: flex; gap: 36rpx; margin-right: 24rpx; }
.bar-action { display: flex; flex-direction: column; align-items: center; gap: 4rpx; }
.bar-text { font-size: 20rpx; color: #999; }
.btn-buy {
  flex: 1; height: 84rpx; line-height: 84rpx;
  background: linear-gradient(135deg, #2979FF, #1565C0);
  color: #fff; font-size: 30rpx; border-radius: 42rpx; text-align: center;
  border: none; font-weight: 600; padding: 0;
}

/* #ifdef H5 */
/* ==================== 桌面适配（B6，仅 H5 编译，不进小程序包） ==================== */

/* 内容限宽 1200px 居中 */
.page-detail {
  @include content-limit($content-max-page);
}

/* 底部操作条宽屏限宽居中（≥768px 生效，与内容列同宽） */
.bottom-bar {
  @include fixed-bar-limit($content-max-page);
}

@include screen-tablet-up {
  .page-detail {
    padding-bottom: 100px;
  }

  /* 封面 750rpx 固定宽在桌面折算约 375px 偏小，改为跟随内容列 */
  .cover-img {
    width: 100%;
    height: 300px;
  }

  .bottom-bar {
    padding: 12px 24px;
  }
  /* 提交按钮不再全宽拉伸，右对齐定宽更符合桌面习惯 */
  .btn-buy {
    flex: 0 0 auto;
    width: 320px;
    margin-left: auto;
  }
}

@include screen-desktop-up {
  /* ≥1200px：封面（左 46%）与价格卡+流程卡（右 54%）双栏，保障/说明/评价通栏；
     grid-template-areas 只给现有卡片指定区域，不改 DOM 顺序 */
  .page-detail {
    display: grid;
    grid-template-columns: minmax(0, 46fr) minmax(0, 54fr);
    grid-template-areas:
      "cover     price"
      "cover     flow"
      "guarantee guarantee"
      "desc      desc"
      "review    review";
    gap: 20px 24px;
    align-content: start;
    padding: 20px 24px 110px;
  }
  .img-wrap {
    grid-area: cover;
    border-radius: 16px;
    overflow: hidden;
  }
  .cover-img {
    height: 340px;
  }
  .price-card {
    /* 双栏下取消 -24rpx 叠压封面的效果 */
    grid-area: price;
    margin: 0;
  }
  .flow-card {
    grid-area: flow;
    margin: 0;
    align-self: start;
  }
  .guarantee-card {
    grid-area: guarantee;
    margin: 0;
  }
  /* 通栏保障卡一行四项 */
  .guarantee-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }
  .desc-card {
    grid-area: desc;
    margin: 0;
  }
  .review-card {
    grid-area: review;
    margin: 0;
  }

  .bottom-bar {
    border-radius: 12px 12px 0 0;
  }
}
/* #endif */
</style>
