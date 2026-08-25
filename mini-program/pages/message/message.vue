<template>
  <view class="page-message">
    <view class="msg-item clickable" v-for="s in sessions" :key="s.id" @click="goRoom(s)">
      <view class="msg-ri-wrap">
        <i class="ri-customer-service-2-line" style="font-size:36rpx;color:#fff;" />
      </view>
      <view class="msg-info">
        <view class="msg-top">
          <text class="msg-title">{{ s.order?.title || '订单沟通' }}</text>
          <text class="msg-time">{{ fmtTime(s.last_message_at) }}</text>
        </view>
        <text class="msg-desc text-ellipsis">{{ s.last_message || '暂无消息' }}</text>
      </view>
      <view class="msg-badge" v-if="s.user_unread">{{ s.user_unread }}</view>
    </view>
    <view v-if="!sessions.length" class="empty">
      <text>暂无消息</text>
      <text class="empty-sub">下单后可在订单详情中「联系团队」商议报价</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useChatStore } from '@/store/chat.js';
import { useAuthStore } from '@/store/auth.js';

const chatStore = useChatStore();
const authStore = useAuthStore();
const sessions = ref([]);

onShow(async () => {
  if (!authStore.isLogin) return;
  try {
    await chatStore.fetchSessions();
    sessions.value = chatStore.sessions || [];
  } catch (e) { console.log(e); }
});

const fmtTime = (d) => (d ? String(d).replace('T', ' ').slice(5, 16) : '');
const goRoom = (s) => {
  uni.navigateTo({ url: '/subpkg/chat/room?sessionId=' + s.id + '&orderId=' + (s.order_id || '') });
};
</script>

<style lang="scss" scoped>
.page-message { min-height: 100vh; background: #fff; }
.msg-item { display: flex; align-items: center; gap: 20rpx; padding: 24rpx 30rpx; border-bottom: 1rpx solid var(--border); }
.msg-item:active { background: #f8f8f8; }
.msg-ri-wrap { width: 80rpx; height: 80rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: linear-gradient(135deg, #2979FF, #1565C0); }
.msg-info { flex: 1; overflow: hidden; }
.msg-top { display: flex; justify-content: space-between; align-items: center; gap: 16rpx; }
.msg-title { font-size: 28rpx; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.msg-time { font-size: 22rpx; color: var(--text-light); flex-shrink: 0; }
.msg-desc { font-size: 24rpx; color: var(--text-light); margin-top: 6rpx; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.msg-badge { min-width: 32rpx; height: 32rpx; line-height: 32rpx; text-align: center; background: var(--danger); color: #fff; font-size: 20rpx; border-radius: 16rpx; padding: 0 8rpx; flex-shrink: 0; }
.empty { text-align: center; padding: 120rpx 40rpx; color: var(--text-light); display: flex; flex-direction: column; gap: 12rpx; }
.empty-sub { font-size: 22rpx; color: #ccc; }

/* #ifdef H5 */
/* ==================== 桌面适配（规划书 §4.10 / 任务 D2，仅 H5 编译，不进小程序包） ==================== */
/* 会话列表整体限宽 960px 居中，页面灰底铺满、白色列表列居中 */
.page-message { @include content-limit($content-max-chat); }

@media (min-width: $bp-tablet) {
  /* --window-top 只含页头 44px，topWindow 高度用 --top-window-height 另行扣除，避免整页超高 61px */
  .page-message { min-height: calc(100vh - var(--window-top) - var(--top-window-height, 0px)); }
  /* 行内间距与头像微调 */
  .msg-item { padding: 20px 24px; gap: 14px; }
  .msg-ri-wrap { width: 48px; height: 48px; }
}

/* 桌面鼠标悬停反馈（触屏不受影响） */
@media (hover: hover) and (pointer: fine) {
  .msg-item:hover { background: #F7F9FC; }
}
/* #endif */
</style>
