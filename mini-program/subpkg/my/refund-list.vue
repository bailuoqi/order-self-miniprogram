<template>
  <view class="page-refund">
    <view class="refund-item card hover-lift" v-for="r in refunds" :key="r.id" @click="goDetail(r)">
      <view class="rf-header">
        <text class="rf-order">退款单：{{ r.refund_no }}</text>
        <text class="rf-status" :style="{ color: statusColor(r.status) }">{{ statusMap[r.status] || r.status }}</text>
      </view>
      <view class="rf-body">
        <view class="rf-info">
          <text class="rf-name">{{ r.order?.title || '订单 #' + r.order_id }}</text>
          <text class="rf-reason">退款原因：{{ r.reason }}</text>
        </view>
        <text class="rf-amount">¥{{ fmtPrice(r.amount) }}</text>
      </view>
    </view>
    <view v-if="!refunds.length" class="empty">
      <view class="empty-icon-box">
        <i class="ri-inbox-line" style="font-size:64rpx;color:#C5CAD6;" />
      </view>
      <text>暂无退款记录</text>
    </view>
  </view>
</template>

<script setup>
const goDetail = (refund) => uni.navigateTo({ url: "/subpkg/order/detail?id=" + (refund?.order_id || "") });
const statusColor = (s) => ({ pending: "#FF9100", approved: "#00C853", rejected: "#FF3D00", completed: "#00C853" }[s] || "#999");
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api } from '@/api/request.js';

const refunds = ref([]);
const loading = ref(true);

onShow(async () => {
  loading.value = true;
  try {
    refunds.value = await api.get('/refunds/my');
  } catch (e) { console.log(e); }
  finally { loading.value = false; }
});

const statusMap = { pending: '审核中', approved: '已通过', rejected: '已拒绝', completed: '已退款' };
const fmtPrice = (fen) => (fen / 100).toFixed(2);
</script>

<style lang="scss" scoped>
.page-refund { padding: 20rpx; min-height: 100vh; background: var(--bg-page); }
.refund-item { margin-bottom: 20rpx; }
.rf-header { display: flex; justify-content: space-between; margin-bottom: 16rpx; }
.rf-order { font-size: 24rpx; color: var(--text-light); }
.rf-status { font-size: 26rpx; font-weight: 600; }
.rf-body { display: flex; gap: 16rpx; align-items: center; }
.rf-img { width: 100rpx; height: 100rpx; border-radius: 8rpx; background: #f0f0f0; }
.rf-info { flex: 1; }
.rf-name { font-size: 26rpx; font-weight: 600; display: block; }
.rf-reason { font-size: 22rpx; color: var(--text-light); display: block; margin-top: 6rpx; }
.rf-amount { font-size: 28rpx; color: var(--danger); font-weight: 700; }
.empty { text-align: center; padding: 100rpx; color: var(--text-light); display: flex; flex-direction: column; align-items: center; gap: 16rpx; }
.empty-icon-box { width: 128rpx; height: 128rpx; border-radius: 50%; background: #F0F2F7; display: flex; align-items: center; justify-content: center; }

/* #ifdef H5 */
/* ==================== 桌面适配（规划书 §4.13 / 任务 D5，仅 H5 编译，不进小程序包） ==================== */
/* 退款卡与空态统一居中 760px */
.refund-item { @include content-limit($content-max-form); }
.empty { @include content-limit($content-max-form); }

@media (min-width: $bp-tablet) {
  /* 100vh 未扣页头与 topWindow 高度会使短内容页凭空多出约 105px 空滚动 */
  .page-refund { padding: 24px 20px; min-height: calc(100vh - var(--window-top) - var(--top-window-height, 0px)); box-sizing: border-box; }
}
/* #endif */
</style>
