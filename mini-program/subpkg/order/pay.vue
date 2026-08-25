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
      <!-- 开发环境模拟支付（H5 宽屏加「演示环境」角标，见样式区 C6） -->
      <button class="btn-mock" :disabled="paying" @click="doMockPay">模拟支付成功（开发演示）<!-- #ifdef H5 --><text class="demo-badge">演示环境</text><!-- #endif --></button>
    </view>

    <!-- #ifdef H5 -->
    <!-- 桌面（≥768px）支付说明：窄屏隐藏与小程序保持一致 -->
    <view class="desk-pay-help">
      <text class="dph-title">支付说明</text>
      <text class="dph-line">· {{ stage === 'deposit' ? '定金支付后团队即排期开工，制作进度可在订单详情查看' : '尾款在成果交付且确认无误后支付，付清后即可评价本单' }}</text>
      <text class="dph-line">· 支付金额以双方确认的报价为准，总价 / 定金 / 尾款明细见上方金额卡</text>
      <text class="dph-line">· 当前为电脑端演示环境，请使用「模拟支付」按钮走通流程，正式支付请在微信小程序内完成</text>
    </view>
    <!-- #endif -->
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

/* ≥768px：金额卡 + 支付方式卡 + 按钮区 + 支付说明整体居中 560px（规划书 §4.9） */
.pay-amount,
.pay-methods,
.pay-submit,
.desk-pay-help {
  @include content-limit($content-max-pay);
}

/* 「演示环境」角标仅宽屏显示（窄屏 H5 维持现状按钮文案） */
.demo-badge { display: none; }

/* 桌面支付说明：窄屏一律隐藏，保持与小程序视觉一致 */
.desk-pay-help { display: none; }

@include screen-tablet-up {
  .pay-amount { padding: 60rpx 30rpx; }

  /* 支付说明卡：交代定金/尾款机制与演示环境边界 */
  .desk-pay-help { display: block; background: #fff; border-radius: var(--radius); padding: 18px 22px; margin-top: 4px; box-shadow: var(--shadow); }
  .dph-title { display: block; font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 8px; }
  .dph-line { display: block; font-size: 12px; color: var(--text-secondary); line-height: 1.8; }

  /* uni-button 默认 overflow:hidden，会把突出按钮上缘的角标裁掉，需放开 */
  .btn-mock { position: relative; overflow: visible; }

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
