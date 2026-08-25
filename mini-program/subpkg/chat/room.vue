<template>
  <view class="page-chat-room">
    <view class="order-bar clickable" v-if="orderTitle" @click="goOrder">
      <i class="ri-file-list-3-line" style="font-size:28rpx;color:#2979FF;" />
      <text class="ob-title">{{ orderTitle }}</text>
      <text class="ob-link">查看订单 ›</text>
    </view>

    <scroll-view scroll-y class="msg-list" :scroll-top="scrollTop" :scroll-with-animation="true">
      <view class="msg-item" v-for="(m, i) in messages" :key="m.id || i" :class="m.from_team ? 'left' : 'right'">
        <view class="msg-avatar team" v-if="m.from_team">
          <i class="ri-customer-service-2-line" style="font-size:32rpx;color:#fff;" />
        </view>
        <view class="msg-wrap">
          <text class="msg-sender" v-if="m.from_team">{{ m.sender_name || '团队' }}</text>
          <view class="msg-bubble" :class="m.from_team ? 'other' : 'self'">
            <text v-if="m.type === 'text' || !m.type">{{ m.content }}</text>
            <image v-if="m.type === 'image'" :src="m.content" mode="widthFix" class="msg-img clickable" @click="preview(m.content)" />
          </view>
        </view>
        <view class="msg-avatar me" v-if="!m.from_team">
          <i class="ri-user-3-line" style="font-size:32rpx;color:#fff;" />
        </view>
      </view>
      <view class="empty-wrap" v-if="!messages.length">
        <empty-state
          icon="chat-3-line"
          title="开始与团队沟通"
          desc="就报价、需求细节、工期在这里与接单团队商议，聊天记录会一直保留"
        />
        <view class="quick-asks">
          <view class="qa-chip clickable" v-for="q in quickAsks" :key="q" @click="inputText = q">{{ q }}</view>
        </view>
      </view>
    </scroll-view>

    <!-- #ifdef H5 -->
    <!-- 桌面（≥768px）操作提示，窄屏隐藏与小程序保持一致 -->
    <view class="desk-chat-hint">
      <text>按 Enter 发送 · 新消息每 5 秒自动刷新 · 文档类资料可粘贴链接说明</text>
    </view>
    <!-- #endif -->

    <view class="input-bar">
      <view class="input-wrap">
        <input class="msg-input" v-model="inputText" placeholder="输入消息..." confirm-type="send" @confirm="sendMsg" />
      </view>
      <text class="send-btn clickable" @click="sendMsg">发送</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useChatStore } from '@/store/chat.js';
import EmptyState from '@/components/empty-state.vue';

const chatStore = useChatStore();
const messages = ref([]);
const inputText = ref('');

/** 空会话时的快捷开场语：点击填入输入框，可编辑后发送 */
const quickAsks = [
  '麻烦尽快评估报价，谢谢',
  '我的预算范围是：',
  '期望工期是：',
  '需求细节补充：',
];
const sessionId = ref(0);
const orderId = ref(0);
const orderTitle = ref('');
const scrollTop = ref(0);
let timer = null;

onLoad(async (options) => {
  orderId.value = +options.orderId || 0;
  if (options.sessionId && +options.sessionId) {
    sessionId.value = +options.sessionId;
  } else if (orderId.value) {
    const session = await chatStore.openOrderSession(orderId.value);
    sessionId.value = session.id;
  }
  const session = chatStore.currentSession;
  if (session?.order) {
    orderTitle.value = session.order.title;
    orderId.value = session.order.id;
  }
  await loadMessages();
  try { await chatStore.markRead(sessionId.value); } catch (e) {}
  // 轮询新消息（简单实现）
  timer = setInterval(loadMessages, 5000);
});

onUnmounted(() => { if (timer) clearInterval(timer); });

const loadMessages = async () => {
  if (!sessionId.value) return;
  try {
    await chatStore.fetchMessages(sessionId.value);
    messages.value = chatStore.messages || [];
    // #ifdef H5
    // 等消息节点渲染完成再设置 scrollTop，否则滚底估算在可滚动高度为 0 时被浏览器
    // 钳到 0，且后续轮询设同值不触发更新，列表永远停在顶部（验收流程 6）
    await new Promise((resolve) => setTimeout(resolve, 0));
    // #endif
    scrollTop.value = messages.value.length * 200;
  } catch (e) { console.log(e); }
};

const sendMsg = async () => {
  const text = inputText.value.trim();
  if (!text || !sessionId.value) return;
  inputText.value = '';
  try {
    await chatStore.sendMessage(sessionId.value, text);
    await loadMessages();
  } catch (e) {
    uni.showToast({ title: '发送失败', icon: 'none' });
  }
};

const preview = (url) => uni.previewImage({ urls: [url] });
const goOrder = () => {
  if (orderId.value) uni.navigateTo({ url: '/subpkg/order/detail?id=' + orderId.value });
};
</script>

<style lang="scss" scoped>
.page-chat-room { height: 100vh; display: flex; flex-direction: column; background: var(--bg-page); }
.order-bar { display: flex; align-items: center; gap: 10rpx; background: #E3F2FD; padding: 18rpx 24rpx; }
.ob-title { flex: 1; font-size: 26rpx; color: #1565C0; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ob-link { font-size: 24rpx; color: #2979FF; flex-shrink: 0; }
.msg-list { flex: 1; padding: 20rpx 24rpx; box-sizing: border-box; }
.msg-item { display: flex; margin-bottom: 30rpx; gap: 16rpx; }
.msg-item.left { flex-direction: row; }
.msg-item.right { flex-direction: row-reverse; }
.msg-avatar { width: 72rpx; height: 72rpx; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.msg-avatar.team { background: linear-gradient(135deg, #2979FF, #1565C0); }
.msg-avatar.me { background: linear-gradient(135deg, #FF9100, #FF6D00); }
.msg-wrap { max-width: 480rpx; display: flex; flex-direction: column; }
.msg-item.right .msg-wrap { align-items: flex-end; }
.msg-sender { font-size: 22rpx; color: var(--text-light); margin-bottom: 6rpx; }
.msg-bubble { padding: 20rpx 24rpx; border-radius: 12rpx; font-size: 28rpx; line-height: 1.5; word-break: break-all; }
.msg-bubble.other { background: #fff; border-top-left-radius: 4rpx; }
.msg-bubble.self { background: var(--primary-light); border-top-right-radius: 4rpx; }
.msg-img { max-width: 300rpx; border-radius: 8rpx; display: block; }
.empty-wrap { display: flex; flex-direction: column; align-items: center; padding-top: 40rpx; }
.quick-asks { display: flex; flex-wrap: wrap; justify-content: center; gap: 16rpx; padding: 0 40rpx; margin-top: -20rpx; }
.qa-chip { background: #fff; border: 1rpx solid var(--border); border-radius: 32rpx; padding: 12rpx 28rpx; font-size: 24rpx; color: var(--text-secondary); }
.qa-chip:active { background: var(--primary-light); color: var(--primary-dark); }
.input-bar { display: flex; align-items: center; gap: 16rpx; padding: 16rpx 20rpx; background: #fff; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.04); }
.input-wrap { flex: 1; background: var(--bg-page); border-radius: 36rpx; padding: 12rpx 24rpx; }
.msg-input { width: 100%; font-size: 28rpx; line-height: 1.4; }
.send-btn { flex-shrink: 0; font-size: 28rpx; color: var(--primary); font-weight: 700; padding: 10rpx 20rpx; }

/* #ifdef H5 */
/* ==================== 桌面适配（规划书 §4.8 / 任务 D1，仅 H5 编译，不进小程序包） ==================== */
/* H5 全宽度：100vh 未扣固定页头（窄屏 44px）与宽屏 topWindow 高度，长消息列表会把
   输入条顶出视口、消息滚动发生在整页而非 scroll-view 内（验收流程 6）。
   统一扣除，并放开 msg-list 的 flex min-height:auto 撑高，让列表内部滚动。 */
.page-chat-room { height: calc(100vh - var(--window-top) - var(--top-window-height, 0px)); }
.msg-list { min-height: 0; }

/* 顶部订单条、消息列表、输入条同宽：整列限宽 960px 居中 */
.order-bar { @include content-limit($content-max-chat); }
.msg-list { @include content-limit($content-max-chat); }
.input-bar { @include content-limit($content-max-chat); }
.desk-chat-hint { @include content-limit($content-max-chat); }

/* 桌面操作提示：窄屏一律隐藏，保持与小程序视觉一致 */
.desk-chat-hint { display: none; }

@media (min-width: $bp-tablet) {
  /* 输入条上方的操作提示行（Enter 发送 / 轮询刷新 / 资料链接） */
  .desk-chat-hint { display: block; flex-shrink: 0; padding: 6px 24px; font-size: 12px; color: var(--text-light); text-align: right; }

  /* 快捷开场语在桌面呈按钮态 */
  .qa-chip { padding: 8px 18px; font-size: 13px; }
  .order-bar { border-radius: 0 0 12px 12px; }
  .msg-list { padding: 24px; }
  /* 气泡最大宽度由固定 480rpx 放宽到列宽百分比（约 60%） */
  .msg-wrap { max-width: 62%; }
  .msg-img { max-width: 320px; }
  .input-bar { border-radius: 12px 12px 0 0; padding: 12px 16px; gap: 12px; }
  .input-wrap { padding: 10px 18px; border-radius: 20px; }
  /* 发送键在桌面呈按钮态（Enter 发送依赖 input 的 confirm-type="send"，逻辑不动） */
  .send-btn { background: var(--primary); color: #fff; border-radius: 18px; padding: 8px 22px; font-size: 14px; }
}

/* 桌面鼠标悬停反馈（触屏不受影响） */
@media (hover: hover) and (pointer: fine) {
  .qa-chip:hover { border-color: var(--primary); color: var(--primary); }
}
/* #endif */
</style>
