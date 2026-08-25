<template>
  <view class="c-empty">
    <view class="ce-icon-wrap">
      <i class="ce-icon" :class="'ri-' + icon" />
    </view>
    <text class="ce-title">{{ title }}</text>
    <text class="ce-desc" v-if="desc">{{ desc }}</text>
    <view class="ce-btn clickable" v-if="actionText" @click="emit('action')">{{ actionText }}</view>
  </view>
</template>

<script setup>
/**
 * 通用空状态：图标 + 标题 + 一句话说明 + 主操作按钮。
 * 图标名只能取 static/fonts/remixicon-trimmed.css 中已收录的图标（去掉 ri- 前缀）。
 */
defineProps({
  icon: { type: String, default: 'inbox-line' },
  title: { type: String, required: true },
  desc: { type: String, default: '' },
  actionText: { type: String, default: '' },
});

const emit = defineEmits(['action']);
</script>

<style lang="scss" scoped>
.c-empty { display: flex; flex-direction: column; align-items: center; padding: 100rpx 40rpx; }
.ce-icon-wrap { width: 128rpx; height: 128rpx; border-radius: 50%; background: var(--primary-light, #E3F2FD); display: flex; align-items: center; justify-content: center; }
.ce-icon { font-size: 64rpx; color: var(--primary, #2979FF); }
.ce-title { font-size: 30rpx; font-weight: 600; color: var(--text-main, #1A1A2E); margin-top: 28rpx; }
.ce-desc { font-size: 24rpx; color: var(--text-light, #999); margin-top: 12rpx; line-height: 1.7; text-align: center; max-width: 560rpx; }
.ce-btn { margin-top: 36rpx; padding: 16rpx 56rpx; border-radius: 40rpx; background: linear-gradient(135deg, #2979FF, #1565C0); color: #fff; font-size: 26rpx; font-weight: 600; }

/* #ifdef H5 */
/* 桌面（≥768px）：空态略微加大留白，按钮 hover 反馈由全局 .clickable 承担 */
@include screen-tablet-up {
  .c-empty { padding: 64px 24px; }
  .ce-desc { max-width: 420px; }
}
/* #endif */
</style>
