<template>
  <view class="page-pay" v-if="order">
    <view class="pay-header">
      <i class="ri-secure-payment-line" style="font-size:36rpx;color:#FF9100;" />
      <text class="pay-countdown">{{ stage === 'deposit' ? '支付定金后团队开工' : '支付尾款完成结算' }}</text>
    </view>

    <view class="pay-amount card">
      <text class="amount-label">{{ stage === 'deposit' ? '定金金额' : '尾款金额' }}</text>
      <view class="amount-value"><text class="symbol">¥</text><text class="value">{{ fmtPrice(amount) }}</text></view>
      <text class="order-no">订单号：{{ order.order_no }}</text>
      <view class="amount-detail">
        <text>总价 ¥{{ fmtPrice(order.quote_amount) }}</text>
        <text>定金 ¥{{ fmtPrice(order.deposit_amount) }}</text>
        <text>尾款 ¥{{ fmtPrice(order.final_amount) }}</text>
      </view>
    </view>

    <view class="pay-methods card">
      <text class="pm-title">支付方式</text>
      <view class="pm-item active">
        <i class="ri-wechat-pay-line" style="font-size:44rpx;color:#00C853;" />
        <text class="pm-name">微信支付</text>
        <view class="pm-check"><i class="ri-check-line" style="font-size:22rpx;color:#fff;" /></view>
      </view>
    </view>

    <view class="pay-submit">
      <button class="btn-pay" :disabled="paying" @click="doPay">
        {{ stage === 'deposit' ? '支付定金' : '支付尾款' }} ¥{{ fmtPrice(amount) }}
      </button>
      <!-- 开发环境模拟支付 -->
      <button class="btn-mock" :disabled="paying" @click="doMockPay">
        模拟支付成功（开发演示）
        <!-- #ifdef H5 -->
        <text class="demo-badge">演示环境</text>
        <!-- #endif -->
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useOrderStore } from '@/store/order.js';
import { api } from '@/api/request.js';

const orderStore = useOrderStore();
const order = ref(null);
const stage = ref('deposit');
const paying = ref(false);

onLoad(async (options) => {
  stage.value = options.stage === 'final' ? 'final' : 'deposit';
  await orderStore.fetchDetail(options.orderId);
  order.value = orderStore.currentOrder;
});

const amount = computed(() => {
  if (!order.value) return 0;
  return stage.value === 'deposit' ? order.value.deposit_amount : order.value.final_amount;
});

const fmtPrice = (fen) => ((fen || 0) / 100).toFixed(2);

const onPaid = () => {
  uni.showToast({ title: '支付成功', icon: 'success' });
  setTimeout(() => {
    uni.redirectTo({ url: '/subpkg/order/detail?id=' + order.value.id });
  }, 1200);
};

/** 正式微信支付（小程序环境） */
const doPay = async () => {
  if (paying.value) return;

  // #ifdef H5
  uni.showModal({
    title: '提示',
    content: 'H5 预览环境无法调起微信支付，请使用下方「模拟支付」演示流程',
    showCancel: false,
  });
  return;
  // #endif

  paying.value = true;
  try {
    const res = await api.post('/payment/wxpay', { order_id: order.value.id, stage: stage.value });
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: res.payParams.timeStamp,
      nonceStr: res.payParams.nonceStr,
      package: res.payParams.package,
      signType: res.payParams.signType || 'MD5',
      paySign: res.payParams.paySign,
      success: onPaid,
      fail: () => uni.showToast({ title: '支付取消或失败', icon: 'none' }),
    });
  } catch (e) {
    uni.showToast({ title: e.message || '支付失败', icon: 'none' });
  } finally {
    paying.value = false;
  }
};

/** 开发环境模拟支付 */
const doMockPay = async () => {
  if (paying.value) return;
  paying.value = true;
  try {
    await api.post('/payment/mock', { order_id: order.value.id, stage: stage.value });
    onPaid();
  } catch (e) {
    uni.showToast({ title: e.message || '模拟支付失败', icon: 'none' });
  } finally {
    paying.value = false;
  }
};
</script>

<style lang="scss" scoped>
.page-pay { min-height: 100vh; background: var(--bg-page); }
.pay-header { display: flex; align-items: center; justify-content: center; gap: 12rpx; padding: 30rpx; background: #FFF3E0; }
.pay-countdown { font-size: 28rpx; color: var(--warning); font-weight: 600; }
.pay-amount { margin: 20rpx; text-align: center; padding: 50rpx 30rpx; }
.amount-label { font-size: 26rpx; color: var(--text-light); display: block; }
.amount-value { margin: 20rpx 0; }
.symbol { font-size: 40rpx; color: var(--danger); font-weight: 700; }
.value { font-size: 72rpx; color: var(--danger); font-weight: 700; }
.order-no { font-size: 24rpx; color: var(--text-light); display: block; }
.amount-detail { display: flex; justify-content: center; gap: 24rpx; margin-top: 24rpx; font-size: 22rpx; color: var(--text-light); }
.pay-methods { margin: 20rpx; }
.pm-title { font-size: 28rpx; font-weight: 700; display: block; margin-bottom: 20rpx; }
.pm-item { display: flex; align-items: center; gap: 16rpx; padding: 24rpx 0; }
.pm-name { flex: 1; font-size: 30rpx; }
.pm-check { width: 40rpx; height: 40rpx; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; }
.pay-submit { padding: 30rpx; padding-bottom: calc(30rpx + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 20rpx; }
.btn-pay { width: 100%; height: 88rpx; line-height: 88rpx; background: linear-gradient(135deg, #2979FF, #1565C0); color: #fff; font-size: 32rpx; border-radius: 44rpx; text-align: center; border: none; font-weight: 600; padding: 0; }
.btn-mock { width: 100%; height: 80rpx; line-height: 80rpx; background: #fff; color: var(--warning); font-size: 28rpx; border-radius: 40rpx; text-align: center; border: 2rpx solid var(--warning); font-weight: 600; padding: 0; }

/* #ifdef H5 */
/* ==================== 桌面适配（任务 C6，仅 H5 编译，不进小程序包） ==================== */

/* ≥768px：金额卡 + 支付方式卡 + 按钮区整体居中 560px（规划书 §4.9） */
.pay-amount,
.pay-methods,
.pay-submit {
  @include content-limit($content-max-pay);
}

/* 「演示环境」角标仅宽屏显示（窄屏 H5 维持现状按钮文案） */
.demo-badge { display: none; }

@include screen-tablet-up {
  .pay-amount { padding: 60rpx 30rpx; }

  .btn-mock { position: relative; }

  .demo-badge {
    display: block;
    position: absolute;
    top: -10px;
    right: 16px;
    background: var(--warning);
    color: #fff;
    font-size: 11px;
    line-height: 1;
    padding: 4px 10px;
    border-radius: 999px;
    font-weight: 600;
  }
}
/* #endif */
</style>
