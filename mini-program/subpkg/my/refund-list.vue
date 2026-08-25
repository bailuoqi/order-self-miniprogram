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
    <empty-state
      v-if="!loading && !refunds.length"
      icon="money-cny-circle-line"
      title="暂无退款记录"
      desc="支付后如订单有异常，可在订单详情申请退款，团队审核通过后按原路退回"
      action-text="查看我的订单"
      @action="goOrders"
    />

    <!-- #ifdef H5 -->
    <!-- 桌面（≥768px）退款说明：窄屏隐藏与小程序保持一致 -->
    <view class="desk-refund-help" v-if="!loading">
      <text class="drh-title">退款说明</text>
      <view class="drh-line"><text class="drh-num">1</text><text class="drh-text">申请入口：订单详情页「申请退款」，定金或尾款支付后均可发起</text></view>
      <view class="drh-line"><text class="drh-num">2</text><text class="drh-text">团队审核：结合订单进度与已投入的工作量进行核对</text></view>
      <view class="drh-line"><text class="drh-num">3</text><text class="drh-text">退回方式：审核通过后按原支付渠道退回，进度可在本页查看</text></view>
    </view>
    <!-- #endif -->
  </view>
</template>

<script setup>
const goDetail = (refund) => uni.navigateTo({ url: "/subpkg/order/detail?id=" + (refund?.order_id || "") });
const statusColor = (s) => ({ pending: "#FF9100", approved: "#00C853", rejected: "#FF3D00", completed: "#00C853" }[s] || "#999");
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api } from '@/api/request.js';
import EmptyState from '@/components/empty-state.vue';

const goOrders = () => uni.switchTab({ url: '/pages/order/list' });

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

/* #ifdef H5 */
/* ==================== 桌面适配（规划书 §4.13 / 任务 D5，仅 H5 编译，不进小程序包） ==================== */
/* 退款卡与说明卡统一居中 760px */
.refund-item { @include content-limit($content-max-form); }
.desk-refund-help { @include content-limit($content-max-form); }

/* 桌面退款说明：窄屏一律隐藏，保持与小程序视觉一致 */
.desk-refund-help { display: none; }

@media (min-width: $bp-tablet) {
  /* 100vh 未扣页头与 topWindow 高度会使短内容页凭空多出约 105px 空滚动 */
  .page-refund { padding: 24px 20px; min-height: calc(100vh - var(--window-top) - var(--top-window-height, 0px)); box-sizing: border-box; }

  /* 退款三步说明卡 */
  .desk-refund-help { display: block; background: #fff; border-radius: 12px; padding: 20px 24px; margin-top: 20px; box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04); }
  .drh-title { display: block; font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 10px; }
  .drh-line { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; }
  .drh-num { width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background: var(--primary-light); color: var(--primary-dark); font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .drh-text { font-size: 13px; color: var(--text-secondary); line-height: 1.7; }
}
/* #endif */
</style>
