<template>
  <view class="page-review" v-if="order">
    <view class="card">
      <text class="rv-title">{{ order.title }}</text>
      <text class="rv-sub">订单号：{{ order.order_no }}</text>

      <view class="star-row">
        <text class="star-label">整体评分</text>
        <view class="stars">
          <i v-for="s in 5" :key="s" class="ri-star-fill" style="font-size:56rpx;"
            :style="{ color: s <= score ? '#FF9100' : '#E0E0E0' }" @click="score = s" />
        </view>
        <text class="star-text">{{ ['很不满意','不满意','一般','满意','非常满意'][score - 1] }}</text>
      </view>

      <textarea class="rv-textarea" v-model="content" placeholder="说说本次服务的体验吧（选填）" :maxlength="500" placeholder-style="color:#ccc" />

      <view class="anon-row" @click="anonymous = !anonymous">
        <view class="anon-check" :class="{ on: anonymous }">
          <i v-if="anonymous" class="ri-check-line" style="font-size:22rpx;color:#fff;" />
        </view>
        <text>匿名评价</text>
      </view>
    </view>

    <view class="submit-bar">
      <button class="sb-btn" :disabled="submitting" @click="submit">提交评价</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useOrderStore } from '@/store/order.js';

const orderStore = useOrderStore();
const order = ref(null);
const score = ref(5);
const content = ref('');
const anonymous = ref(false);
const submitting = ref(false);

onLoad(async (options) => {
  await orderStore.fetchDetail(options.orderId);
  order.value = orderStore.currentOrder;
});

const submit = async () => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    await orderStore.review(order.value.id, {
      score: score.value,
      content: content.value.trim(),
      anonymous: anonymous.value,
    });
    uni.showToast({ title: '评价成功', icon: 'success' });
    setTimeout(() => uni.redirectTo({ url: '/subpkg/order/detail?id=' + order.value.id }), 1200);
  } catch (e) {
    uni.showToast({ title: e.message || '评价失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.page-review { min-height: 100vh; background: var(--bg-page); padding-bottom: 140rpx; }
.card { background: #fff; border-radius: var(--radius); padding: 32rpx; margin: 20rpx; box-shadow: var(--shadow); }
.rv-title { font-size: 32rpx; font-weight: 700; display: block; }
.rv-sub { font-size: 22rpx; color: var(--text-light); display: block; margin-top: 8rpx; }
.star-row { display: flex; flex-direction: column; align-items: center; gap: 16rpx; margin: 40rpx 0; }
.star-label { font-size: 26rpx; color: var(--text-secondary); }
.stars { display: flex; gap: 16rpx; }
.star-text { font-size: 26rpx; color: var(--warning); font-weight: 600; }
.rv-textarea { width: 100%; box-sizing: border-box; min-height: 220rpx; background: #F5F6FA; border-radius: 14rpx; padding: 20rpx; font-size: 28rpx; }
.anon-row { display: flex; align-items: center; gap: 12rpx; margin-top: 24rpx; font-size: 26rpx; color: var(--text-secondary); }
.anon-check { width: 36rpx; height: 36rpx; border: 2rpx solid #ddd; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.anon-check.on { background: var(--primary); border-color: var(--primary); }
.submit-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 16rpx 28rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); display: flex; box-shadow: 0 -4rpx 20rpx rgba(0,0,0,.06); }
.sb-btn { flex: 1; height: 88rpx; line-height: 88rpx; background: linear-gradient(135deg, #2979FF, #1565C0); color: #fff; font-size: 32rpx; border-radius: 44rpx; border: none; font-weight: 600; padding: 0; text-align: center; }
.sb-btn[disabled] { background: #ddd; color: #999; }
</style>
