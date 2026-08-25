<template>
  <view class="page-about">
    <view class="logo-area card">
      <image class="logo" src="/static/icons/logo.png" mode="aspectFit" />
      <text class="app-name">定制接单</text>
      <text class="version">软件定制 · 电子代做</text>
    </view>

    <view class="info card">
      <text class="info-title">关于我们</text>
      <text class="info-desc">我们是一个专注「软件定制开发」与「电子产品代做」的工作室团队。承接小程序/网站/脚本工具/接口对接/系统二次开发，以及 PCB 打样、焊接组装、单片机开发、电路设计、样机打样等合法合规的定制服务。下单后由团队统一评估报价，确认后支付定金开工，交付满意再结尾款。</text>
    </view>

    <view class="info card">
      <text class="info-title">服务流程</text>
      <text class="info-desc">客户下单 → 团队报价商议 → 确认报价 → 支付定金开工 → 交付成果 → 支付尾款 → 评价完成</text>
    </view>

    <view class="contact card">
      <view class="contact-item">
        <text class="ci-label">客服电话</text>
        <text class="ci-value link clickable" @click="callPhone">400-888-8888</text>
      </view>
      <view class="contact-item">
        <text class="ci-label">客服邮箱</text>
        <text class="ci-value">support@dingzhi.work</text>
      </view>
      <view class="contact-item">
        <text class="ci-label">工作时间</text>
        <text class="ci-value">周一至周日 9:00-21:00</text>
      </view>
    </view>

    <text class="copyright">© 2026 定制接单工作室 All Rights Reserved</text>
  </view>
</template>

<script setup>
const callPhone = () => uni.makePhoneCall({ phoneNumber: "4008888888" });
</script>

<style lang="scss" scoped>
.page-about { padding: 20rpx; background: var(--bg-page); min-height: 100vh; text-align: center; }
.logo-area { padding: 60rpx 30rpx; margin-bottom: 20rpx; display: flex; flex-direction: column; align-items: center; gap: 16rpx; }
.logo { width: 120rpx; height: 120rpx; border-radius: 30rpx; background: var(--primary); }
.app-name { font-size: 36rpx; font-weight: 700; }
.version { font-size: 24rpx; color: var(--text-light); }
.info { margin-bottom: 20rpx; text-align: left; }
.info-title { font-size: 28rpx; font-weight: 700; display: block; margin-bottom: 16rpx; }
.info-desc { font-size: 26rpx; color: var(--text-secondary); line-height: 1.8; }
.contact { margin-bottom: 20rpx; text-align: left; }
.contact-item { display: flex; justify-content: space-between; padding: 20rpx 0; border-bottom: 1rpx solid var(--border); }
.contact-item:last-child { border-bottom: none; }
.ci-label { font-size: 28rpx; color: var(--text-secondary); }
.ci-value { font-size: 28rpx; }
.ci-value.link { color: var(--primary); }
.copyright { font-size: 24rpx; color: var(--text-light); padding: 40rpx 0; display: block; }

/* #ifdef H5 */
/* ==================== 桌面适配（规划书 §4.13 / 任务 D5，仅 H5 编译，不进小程序包） ==================== */
/* 品牌卡、介绍卡、联系卡统一居中 760px */
.logo-area { @include content-limit($content-max-form); }
.info { @include content-limit($content-max-form); }
.contact { @include content-limit($content-max-form); }

@media (min-width: $bp-tablet) {
  /* 100vh 未扣页头与 topWindow 高度会使短内容页凭空多出约 105px 空滚动 */
  .page-about { padding: 24px 20px; min-height: calc(100vh - var(--window-top) - var(--top-window-height, 0px)); box-sizing: border-box; }
}
/* #endif */
</style>
