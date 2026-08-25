<template>
  <view class="page-order-detail" v-if="order">
    <!-- 状态横幅 -->
    <view class="status-banner">
      <text class="status-title">{{ statusLabel(order.status) }}</text>
      <text class="status-desc">{{ statusDesc }}</text>
    </view>

    <!-- 报价卡片 -->
    <view class="card quote-card area-quote" v-if="order.quote_amount">
      <view class="card-title-row">
        <text class="card-title">团队报价</text>
        <text class="quote-time">{{ fmtDate(order.quoted_at) }}</text>
      </view>
      <view class="quote-main">
        <view class="quote-item">
          <text class="qi-label">总价</text>
          <text class="qi-value total">¥{{ fmtPrice(order.quote_amount) }}</text>
        </view>
        <view class="quote-item">
          <text class="qi-label">定金</text>
          <text class="qi-value">¥{{ fmtPrice(order.deposit_amount) }}</text>
        </view>
        <view class="quote-item">
          <text class="qi-label">尾款</text>
          <text class="qi-value">¥{{ fmtPrice(order.final_amount) }}</text>
        </view>
        <view class="quote-item">
          <text class="qi-label">工期</text>
          <text class="qi-value">{{ order.quote_days || '-' }}</text>
        </view>
      </view>
      <view class="quote-note" v-if="order.quote_note">
        <text class="qn-label">交付说明（合约要点）</text>
        <text class="qn-text">{{ order.quote_note }}</text>
      </view>
      <view class="quote-confirmed" v-if="order.quote_confirmed_at">
        <i class="ri-checkbox-circle-fill" style="font-size:26rpx;color:#00C853;" />
        <text>已于 {{ fmtDate(order.quote_confirmed_at) }} 确认报价</text>
      </view>
      <!-- 报价历史 -->
      <view class="quote-history" v-if="order.quotes && order.quotes.length > 1">
        <text class="qh-title">报价记录</text>
        <view class="qh-item" v-for="q in order.quotes" :key="q.id">
          <text>¥{{ fmtPrice(q.amount) }}（定金 ¥{{ fmtPrice(q.deposit_amount) }}，工期 {{ q.days || '-' }}）</text>
          <text class="qh-time">{{ fmtDate(q.created_at) }}</text>
        </view>
      </view>
    </view>
    <view class="card quote-card area-quote" v-else>
      <text class="card-title">团队报价</text>
      <view class="quote-empty">
        <text>团队正在评估您的需求，报价后会在这里显示。有疑问可点下方「联系团队」商议。</text>
      </view>
    </view>

    <!-- 交付成果 -->
    <view class="card area-deliver" v-if="order.delivered_at">
      <text class="card-title">交付成果</text>
      <view class="deliver-note" v-if="order.delivery_note">
        <text>{{ order.delivery_note }}</text>
      </view>
      <view class="deliver-files" v-if="order.delivery_files && order.delivery_files.length">
        <view class="df-item clickable" v-for="(f, i) in order.delivery_files" :key="i" @click="openFile(f)">
          <i class="ri-attachment-2" style="font-size:28rpx;color:#2979FF;" />
          <text class="df-name">附件{{ i + 1 }}：{{ f }}</text>
        </view>
      </view>
      <view class="oi-row" v-if="order.delivery_tracking_no">
        <text>快递单号</text>
        <text class="copyable clickable" @click="copy(order.delivery_tracking_no)">{{ order.delivery_tracking_no }}</text>
      </view>
      <view class="oi-row"><text>交付时间</text><text>{{ fmtDate(order.delivered_at) }}</text></view>
    </view>

    <!-- 我的评价 -->
    <view class="card area-review" v-if="order.review_score">
      <text class="card-title">我的评价</text>
      <view class="review-stars">
        <i v-for="s in 5" :key="s" class="ri-star-fill" style="font-size:32rpx;" :style="{ color: s <= order.review_score ? '#FF9100' : '#E0E0E0' }" />
      </view>
      <text class="review-text" v-if="order.review_content">{{ order.review_content }}</text>
    </view>

    <!-- 需求信息 -->
    <view class="card area-require">
      <text class="card-title">需求信息</text>
      <view class="oi-row"><text>需求标题</text><text class="oi-strong">{{ order.title }}</text></view>
      <view class="oi-row"><text>来源</text><text>{{ order.source === 'custom' ? '自定义需求' : '标准服务下单' }}</text></view>
      <view class="oi-row" v-if="order.category"><text>品类</text><text>{{ order.category.name }}</text></view>
      <view class="oi-row" v-if="order.expected_days"><text>期望工期</text><text>{{ order.expected_days }}</text></view>
      <view class="oi-row" v-if="order.contact"><text>联系方式</text><text>{{ order.contact }}</text></view>
      <view class="oi-col" v-if="order.requirement">
        <text class="oi-label">需求描述</text>
        <text class="oi-desc">{{ order.requirement }}</text>
      </view>
      <view class="oi-col" v-if="order.attachments && order.attachments.length">
        <text class="oi-label">附件</text>
        <view class="df-item clickable" v-for="(f, i) in order.attachments" :key="i" @click="openFile(f)">
          <i class="ri-attachment-2" style="font-size:28rpx;color:#2979FF;" />
          <text class="df-name">附件{{ i + 1 }}</text>
        </view>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="card area-info">
      <text class="card-title">订单信息</text>
      <view class="oi-row"><text>订单编号</text><text class="copyable clickable" @click="copy(order.order_no)">{{ order.order_no }}</text></view>
      <view class="oi-row"><text>创建时间</text><text>{{ fmtDate(order.created_at) }}</text></view>
      <view class="oi-row" v-if="order.deposit_paid_at"><text>定金支付</text><text>¥{{ fmtPrice(order.deposit_amount) }} · {{ fmtDate(order.deposit_paid_at) }}</text></view>
      <view class="oi-row" v-if="order.final_paid_at"><text>尾款支付</text><text>¥{{ fmtPrice(order.final_amount) }} · {{ fmtDate(order.final_paid_at) }}</text></view>
      <view class="oi-row" v-if="order.cancel_reason"><text>取消原因</text><text>{{ order.cancel_reason }}</text></view>
    </view>

    <!-- 进度日志 -->
    <view class="card area-logs" v-if="order.logs && order.logs.length">
      <text class="card-title">订单进度</text>
      <view class="timeline">
        <view class="tl-item" v-for="(log, idx) in sortedLogs" :key="idx" :class="{ active: idx === 0 }">
          <view class="tl-dot" />
          <view class="tl-body">
            <text class="tl-title">{{ log.description }}</text>
            <text class="tl-time">{{ fmtDate(log.created_at) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-bar">
      <view class="btn outline clickable" @click="goChat">
        <i class="ri-chat-3-line" style="font-size:26rpx;margin-right:6rpx;" />联系团队
      </view>
      <view class="btn danger clickable" v-if="canCancel" @click="doCancel">取消订单</view>
      <view class="btn danger clickable" v-if="canRefund" @click="applyRefund">申请退款</view>
      <view class="btn primary clickable" v-if="order.status === 'quoting'" @click="doConfirmQuote">确认报价</view>
      <view class="btn primary clickable" v-if="order.status === 'confirmed'" @click="goPay('deposit')">支付定金 ¥{{ fmtPrice(order.deposit_amount) }}</view>
      <view class="btn primary clickable" v-if="order.status === 'delivered'" @click="goPay('final')">支付尾款 ¥{{ fmtPrice(order.final_amount) }}</view>
      <view class="btn primary clickable" v-if="order.status === 'final_paid'" @click="goReview">去评价</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useOrderStore, ORDER_STATUS_MAP } from '@/store/order.js';
import { useChatStore } from '@/store/chat.js';
import { api } from '@/api/request.js';

const orderStore = useOrderStore();
const chatStore = useChatStore();
const order = ref(null);
const orderId = ref(0);

const load = async () => {
  if (!orderId.value) return;
  try {
    await orderStore.fetchDetail(orderId.value);
    order.value = orderStore.currentOrder;
  } catch (e) { console.log(e); }
};

onLoad((options) => { orderId.value = +options.id; });
onShow(() => load());

const fmtPrice = (fen) => ((fen || 0) / 100).toFixed(2);
const fmtDate = (d) => (d ? String(d).replace('T', ' ').slice(0, 16) : '');
const statusLabel = (s) => ORDER_STATUS_MAP[s] || s;

const statusDesc = computed(() => {
  const map = {
    pending_quote: '需求已提交，团队正在评估报价',
    quoting: '团队已报价，请查看并确认，可继续商议',
    confirmed: '报价已确认，请支付定金，付定金后团队开工',
    deposit_paid: '定金已收到，团队制作中，请耐心等待',
    delivered: '成果已交付，请确认后支付尾款',
    final_paid: '尾款已付清，欢迎评价本次服务',
    completed: '订单已完成，感谢您的信任',
    cancelled: '订单已取消',
    refunding: '退款申请处理中',
    refunded: '退款已完成',
  };
  return map[order.value?.status] || '';
});

const sortedLogs = computed(() => {
  const logs = [...(order.value?.logs || [])];
  return logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
});

const canCancel = computed(() => ['pending_quote', 'quoting', 'confirmed'].includes(order.value?.status));
const canRefund = computed(() => ['deposit_paid', 'delivered', 'final_paid'].includes(order.value?.status));

const copy = (text) => uni.setClipboardData({ data: text || '', success: () => uni.showToast({ title: '已复制', icon: 'success' }) });
const SERVER_ORIGIN = 'http://localhost:3001';
const fullUrl = (url) => (url && url.startsWith('/') ? SERVER_ORIGIN + url : url);
const openFile = (url) => {
  const u = fullUrl(url);
  if (/\.(png|jpe?g|gif|webp)$/i.test(u)) {
    uni.previewImage({ urls: [u] });
  } else {
    copy(u);
    uni.showToast({ title: '链接已复制', icon: 'none' });
  }
};

const doConfirmQuote = () => {
  uni.showModal({
    title: '确认报价',
    content: `总价 ¥${fmtPrice(order.value.quote_amount)}，定金 ¥${fmtPrice(order.value.deposit_amount)}，尾款 ¥${fmtPrice(order.value.final_amount)}，工期 ${order.value.quote_days || '-'}。确认后进入待付定金。`,
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await orderStore.confirmQuote(order.value.id);
        order.value = orderStore.currentOrder;
        uni.showToast({ title: '已确认报价', icon: 'success' });
      } catch (e) {
        uni.showToast({ title: e.message || '操作失败', icon: 'none' });
      }
    },
  });
};

const goPay = (stage) => {
  uni.navigateTo({ url: `/subpkg/order/pay?orderId=${order.value.id}&stage=${stage}` });
};

const goReview = () => {
  uni.navigateTo({ url: '/subpkg/order/review?orderId=' + order.value.id });
};

const goChat = async () => {
  try {
    const session = await chatStore.openOrderSession(order.value.id);
    uni.navigateTo({ url: '/subpkg/chat/room?sessionId=' + session.id + '&orderId=' + order.value.id });
  } catch (e) {
    uni.showToast({ title: '打开会话失败', icon: 'none' });
  }
};

const doCancel = () => {
  uni.showModal({
    title: '取消订单',
    content: '确定取消该订单吗？',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await orderStore.cancelOrder(order.value.id, '客户主动取消');
        order.value = orderStore.currentOrder;
        uni.showToast({ title: '已取消', icon: 'success' });
      } catch (e) {
        uni.showToast({ title: e.message || '操作失败', icon: 'none' });
      }
    },
  });
};

const applyRefund = () => {
  uni.showModal({
    title: '申请退款',
    content: '将对已支付金额发起退款申请，团队审核后处理。确定申请吗？',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await api.post('/refunds', { order_id: order.value.id, reason: '客户申请退款' });
        await load();
        uni.showToast({ title: '已提交退款申请', icon: 'success' });
      } catch (e) {
        uni.showToast({ title: e.message || '申请失败', icon: 'none' });
      }
    },
  });
};
</script>

<style lang="scss" scoped>
.page-order-detail { padding-bottom: 160rpx; min-height: 100vh; background: var(--bg-page); }
.status-banner { padding: 50rpx 30rpx; display: flex; flex-direction: column; align-items: center; gap: 14rpx; background: linear-gradient(135deg, #2979FF, #1565C0); }
.status-title { font-size: 40rpx; font-weight: 700; color: #fff; }
.status-desc { font-size: 26rpx; color: rgba(255,255,255,0.85); text-align: center; }

.card { background: #fff; border-radius: var(--radius); padding: 28rpx; margin: 20rpx; box-shadow: var(--shadow); }
.card-title { font-size: 30rpx; font-weight: 700; display: block; margin-bottom: 20rpx; }
.card-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.card-title-row .card-title { margin-bottom: 0; }
.quote-time { font-size: 22rpx; color: var(--text-light); }

.quote-main { display: flex; flex-wrap: wrap; gap: 16rpx; }
.quote-item { flex: 1; min-width: 140rpx; background: #F5F8FF; border-radius: 12rpx; padding: 20rpx; text-align: center; }
.qi-label { font-size: 22rpx; color: var(--text-light); display: block; }
.qi-value { font-size: 30rpx; font-weight: 700; color: var(--text-main); display: block; margin-top: 8rpx; }
.qi-value.total { color: var(--danger); }
.quote-note { margin-top: 20rpx; background: #FFFDE7; border-radius: 12rpx; padding: 20rpx; }
.qn-label { font-size: 22rpx; color: #F57F17; display: block; margin-bottom: 8rpx; font-weight: 600; }
.qn-text { font-size: 26rpx; color: #555; line-height: 1.6; white-space: pre-line; }
.quote-confirmed { display: flex; align-items: center; gap: 8rpx; margin-top: 16rpx; font-size: 24rpx; color: #00C853; }
.quote-empty { font-size: 26rpx; color: var(--text-light); line-height: 1.6; }
.quote-history { margin-top: 24rpx; border-top: 1rpx dashed var(--border); padding-top: 16rpx; }
.qh-title { font-size: 24rpx; color: var(--text-light); display: block; margin-bottom: 10rpx; }
.qh-item { display: flex; justify-content: space-between; font-size: 24rpx; color: var(--text-secondary); padding: 8rpx 0; gap: 12rpx; }
.qh-time { color: var(--text-light); flex-shrink: 0; }

.deliver-note { font-size: 28rpx; color: var(--text-main); line-height: 1.6; margin-bottom: 16rpx; white-space: pre-line; }
.deliver-files { display: flex; flex-direction: column; gap: 12rpx; margin-bottom: 12rpx; }
.df-item { display: flex; align-items: center; gap: 10rpx; background: #F5F8FF; border-radius: 10rpx; padding: 16rpx 20rpx; }
.df-name { font-size: 24rpx; color: #2979FF; word-break: break-all; }

.review-stars { display: flex; gap: 8rpx; margin-bottom: 12rpx; }
.review-text { font-size: 28rpx; color: var(--text-main); line-height: 1.6; }

.oi-row { display: flex; justify-content: space-between; padding: 16rpx 0; font-size: 26rpx; color: var(--text-secondary); border-bottom: 1rpx solid var(--border); gap: 24rpx; }
.oi-row:last-child { border-bottom: none; }
.oi-row text:last-child { text-align: right; word-break: break-all; }
.oi-strong { color: var(--text-main); font-weight: 600; }
.oi-col { padding: 16rpx 0; border-bottom: 1rpx solid var(--border); }
.oi-col:last-child { border-bottom: none; }
.oi-label { font-size: 26rpx; color: var(--text-secondary); display: block; margin-bottom: 10rpx; }
.oi-desc { font-size: 28rpx; color: var(--text-main); line-height: 1.6; white-space: pre-line; }
.copyable { color: var(--primary); text-decoration: underline; }

.timeline { position: relative; }
.tl-item { display: flex; gap: 20rpx; padding-bottom: 28rpx; position: relative; }
.tl-item:last-child { padding-bottom: 0; }
.tl-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: var(--border); margin-top: 8rpx; flex-shrink: 0; }
.tl-item.active .tl-dot { background: var(--primary); box-shadow: 0 0 0 6rpx var(--primary-light); }
.tl-body { flex: 1; }
.tl-title { font-size: 26rpx; display: block; color: var(--text-main); }
.tl-item.active .tl-title { font-weight: 700; color: var(--primary); }
.tl-time { font-size: 22rpx; color: var(--text-light); display: block; margin-top: 6rpx; }

.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; display: flex; justify-content: flex-end; align-items: center; gap: 16rpx; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); box-shadow: 0 -2rpx 16rpx rgba(0,0,0,0.06); flex-wrap: wrap; z-index: 50; }
.btn { padding: 16rpx 28rpx; border-radius: 36rpx; font-size: 26rpx; font-weight: 600; display: flex; align-items: center; }
.btn.outline { border: 2rpx solid var(--border); color: var(--text-main); background: #fff; }
.btn.primary { background: linear-gradient(135deg, #2979FF, #1565C0); color: #fff; }
.btn.danger { border: 2rpx solid var(--danger); color: var(--danger); background: #fff; }

/* #ifdef H5 */
/* ==================== 桌面适配（任务 C4/C5，仅 H5 编译，不进小程序包） ==================== */

/* 768–1199px：单列卡片限宽 1200px 居中，底部固定操作条同步限宽 */
.card {
  @include content-limit($content-max-page);
}

.bottom-bar {
  @include fixed-bar-limit($content-max-page);
}

/* ≥1200px：grid-template-areas 双栏重排（只给现有卡片指定区域，不改 DOM 顺序，规划书 §4.7）。
   左栏 62%：需求信息 / 交付成果 / 我的评价 / 订单信息；
   右栏 38%：团队报价卡 / 操作卡 / 订单进度时间线。
   报价卡跨左栏的条件渲染行（交付/评价缺失时对应行高自动收缩），
   操作卡与订单信息同行、时间线收尾，减少稀疏状态下的左栏空档（1366 走查调优）。 */
@include screen-desktop-up {
  .page-order-detail {
    display: grid;
    grid-template-columns: minmax(0, 62fr) minmax(0, 38fr);
    grid-template-areas:
      "banner banner"
      "require quote"
      "deliver quote"
      "review quote"
      "info actions"
      ". logs";
    align-items: start;
    align-content: start;
    gap: 20px 24px;
    max-width: $content-max-page;
    margin: 0 auto;
    padding: 20px 24px 48px;
    box-sizing: border-box;
  }

  .status-banner { grid-area: banner; border-radius: var(--radius); }
  .area-quote { grid-area: quote; }
  .area-deliver { grid-area: deliver; }
  .area-review { grid-area: review; }
  .area-require { grid-area: require; }
  .area-info { grid-area: info; }
  .area-logs { grid-area: logs; }

  /* 卡片间距改由 grid gap 承担 */
  .card { margin: 0; }

  /* C5：底部固定操作条 → 右栏操作卡（同一组按钮，仅切换定位与排布） */
  .bottom-bar {
    grid-area: actions;
    position: static;
    left: auto;
    right: auto;
    bottom: auto;
    transform: none;
    width: auto;
    max-width: none;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: 12px;
    padding: 20px;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
  }

  .bottom-bar .btn { justify-content: center; padding: 12px 16px; }
}
/* #endif */
</style>
