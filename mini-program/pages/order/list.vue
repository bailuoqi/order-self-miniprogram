<template>
  <view class="page-order-list">
    <!-- 状态Tab -->
    <scroll-view scroll-x class="tabs" :show-scrollbar="false">
      <view v-for="tab in tabs" :key="tab.key" class="tab-item clickable" :class="{ active: activeTab === tab.key }" @click="switchTab(tab.key)">
        <text>{{ tab.label }}</text>
      </view>
    </scroll-view>

    <!-- 订单列表 -->
    <scroll-view scroll-y class="order-list" @scrolltolower="loadMore">
      <!-- #ifdef H5 -->
      <!-- 桌面（≥768px）流程提示条：解释团队定制接单流程，窄屏隐藏与小程序保持一致 -->
      <view class="desk-flow">
        <view class="df-head">
          <text class="df-title">团队定制接单</text>
          <text class="df-sub">所有订单由团队统一评估报价，确认后付定金开工，交付验收再结尾款</text>
        </view>
        <view class="df-steps">
          <text class="df-step">提交需求</text><text class="df-arrow">›</text>
          <text class="df-step">团队报价</text><text class="df-arrow">›</text>
          <text class="df-step">确认报价</text><text class="df-arrow">›</text>
          <text class="df-step">付定金开工</text><text class="df-arrow">›</text>
          <text class="df-step">交付成果</text><text class="df-arrow">›</text>
          <text class="df-step">付尾款评价</text>
        </view>
      </view>
      <!-- #endif -->

      <view class="order-card hover-lift" v-for="order in orders" :key="order.id" @click="goDetail(order)">
        <!-- 订单头 -->
        <view class="order-header">
          <text class="order-no">{{ order.source === 'custom' ? '自定义需求' : '标准服务' }} · {{ order.order_no }}</text>
          <text class="order-status" :style="{ color: statusColor(order.status) }">{{ statusLabel(order.status) }}</text>
        </view>

        <!-- 需求信息 -->
        <view class="order-body">
          <view class="goods-info">
            <text class="goods-name text-ellipsis-2">{{ order.title }}</text>
            <text class="goods-spec" v-if="order.requirement">{{ order.requirement }}</text>
            <text class="goods-count">{{ fmtDate(order.created_at) }}</text>
          </view>
          <view class="goods-price" v-if="order.quote_amount">
            <text>¥{{ fmtPrice(order.quote_amount) }}</text>
          </view>
          <view class="goods-price pending" v-else>
            <text>待报价</text>
          </view>
        </view>

        <!-- 摘要行 -->
        <view class="order-footer">
          <text class="total" v-if="order.quote_amount">定金 ¥{{ fmtPrice(order.deposit_amount) }} · 尾款 ¥{{ fmtPrice(order.final_amount) }}</text>
          <text class="total" v-else>等待团队评估报价</text>
          <view class="btn-group">
            <view class="btn-action primary" v-if="order.status === 'quoting'">确认报价</view>
            <view class="btn-action primary" v-else-if="order.status === 'confirmed'">付定金</view>
            <view class="btn-action primary" v-else-if="order.status === 'delivered'">付尾款</view>
            <view class="btn-action primary" v-else-if="order.status === 'final_paid'">去评价</view>
            <view class="btn-action" v-else>查看详情</view>
          </view>
        </view>
      </view>

      <view class="loading" v-if="loading">加载中...</view>
      <empty-state
        v-if="!loading && !orders.length"
        :icon="activeTab ? 'file-list-2-line' : 'inbox-line'"
        :title="activeTab ? '该状态下暂无订单' : '还没有订单'"
        :desc="activeTab
          ? '切换其他状态看看，或发布一个新需求，团队会尽快评估报价'
          : '把您的软件定制或电子代做需求告诉我们，团队免费评估报价，确认后付定金即开工'"
        :action-text="activeTab ? '查看全部订单' : '发布需求'"
        @action="onEmptyAction"
      />

      <!-- #ifdef H5 -->
      <!-- 桌面（≥768px）辅助信息：状态说明 + 常见问题，填充宽屏下短列表的空档 -->
      <view class="desk-help" v-if="!loading">
        <view class="dh-card">
          <text class="dh-title">订单状态说明</text>
          <view class="dh-line"><text class="dh-term">待报价</text><text class="dh-text">需求已提交，团队评估中，可在聊天里补充细节</text></view>
          <view class="dh-line"><text class="dh-term">待付定金</text><text class="dh-text">报价已双方确认，支付定金后团队排期开工</text></view>
          <view class="dh-line"><text class="dh-term">制作中</text><text class="dh-text">团队制作中，进度可在订单详情的时间线查看</text></view>
          <view class="dh-line"><text class="dh-term">待付尾款</text><text class="dh-text">成果已交付，确认无误后支付尾款完成结算</text></view>
          <view class="dh-line"><text class="dh-term">待评价</text><text class="dh-text">尾款已付清，欢迎评价本次服务</text></view>
        </view>
        <view class="dh-card">
          <text class="dh-title">常见问题</text>
          <view class="dh-qa">
            <text class="dh-q">报价前会收费吗？</text>
            <text class="dh-a">不会。团队免费评估报价，双方确认后才需要支付定金。</text>
          </view>
          <view class="dh-qa">
            <text class="dh-q">对报价有疑问怎么办？</text>
            <text class="dh-a">进入订单详情点「联系团队」，可就价格与需求细节在线商议。</text>
          </view>
          <view class="dh-qa">
            <text class="dh-q">可以退款吗？</text>
            <text class="dh-a">支付后如订单有异常，可在订单详情申请退款，团队审核后按原路退回。</text>
          </view>
        </view>
      </view>
      <!-- #endif -->
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useOrderStore, ORDER_STATUS_MAP, ORDER_STATUS_COLOR } from '@/store/order.js';
import EmptyState from '@/components/empty-state.vue';

const orderStore = useOrderStore();
const activeTab = ref('');
const orders = ref([]);
const loading = ref(false);

const tabs = [
  { key: '', label: '全部' },
  { key: 'pending_quote,quoting', label: '待报价' },
  { key: 'confirmed', label: '待付定金' },
  { key: 'deposit_paid', label: '制作中' },
  { key: 'delivered', label: '待付尾款' },
  { key: 'final_paid', label: '待评价' },
  { key: 'completed', label: '已完成' },
];

const switchTab = async (key) => {
  activeTab.value = key;
  await loadOrders();
};

const loadOrders = async (append = false) => {
  loading.value = true;
  try {
    await orderStore.fetchMyOrders(activeTab.value || undefined, append);
    orders.value = orderStore.myOrders.list || [];
  } catch (e) { console.log(e); }
  finally { loading.value = false; }
};

const loadMore = async () => {
  if (orderStore.myOrders.list.length >= orderStore.myOrders.total) return;
  orderStore.myOrders.page++;
  await loadOrders(true);
};

onShow(() => loadOrders());

const goDetail = (o) => uni.navigateTo({ url: '/subpkg/order/detail?id=' + o.id });
/** 空态主操作：筛选态回到全部订单；全部为空则引导发布需求 */
const onEmptyAction = () => {
  if (activeTab.value) switchTab('');
  else uni.navigateTo({ url: '/subpkg/order/create-custom' });
};
const fmtPrice = (fen) => ((fen || 0) / 100).toFixed(2);
const fmtDate = (d) => (d ? String(d).replace('T', ' ').slice(0, 16) : '');
const statusLabel = (s) => ORDER_STATUS_MAP[s] || s;
const statusColor = (s) => ORDER_STATUS_COLOR[s] || '#999';
</script>

<style lang="scss" scoped>
.page-order-list { height: 100vh; display: flex; flex-direction: column; }
.tabs { background: #fff; white-space: nowrap; border-bottom: 1rpx solid var(--border); flex-shrink: 0; }
.tab-item { display: inline-block; text-align: center; padding: 28rpx 24rpx; font-size: 28rpx; color: var(--text-secondary); position: relative; }
.tab-item.active { color: var(--primary); font-weight: 700; }
.tab-item.active::after { content: ""; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 48rpx; height: 4rpx; background: var(--primary); border-radius: 2rpx; }

.order-list { flex: 1; padding: 20rpx; box-sizing: border-box; }
.order-card { background: #fff; border-radius: var(--radius); padding: 24rpx; margin-bottom: 20rpx; box-shadow: var(--shadow); }
.order-header { display: flex; justify-content: space-between; padding-bottom: 20rpx; border-bottom: 1rpx solid var(--border); gap: 16rpx; }
.order-no { font-size: 22rpx; color: var(--text-light); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.order-status { font-size: 26rpx; font-weight: 600; flex-shrink: 0; }

.order-body { display: flex; gap: 20rpx; padding: 20rpx 0; }
.goods-info { flex: 1; display: flex; flex-direction: column; gap: 10rpx; overflow: hidden; }
.goods-name { font-size: 28rpx; font-weight: 600; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; line-height: 1.4; }
.goods-spec { font-size: 24rpx; color: var(--text-light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.goods-count { font-size: 22rpx; color: var(--text-light); }
.goods-price { font-size: 30rpx; color: var(--danger); font-weight: 700; display: flex; align-items: flex-start; flex-shrink: 0; }
.goods-price.pending { color: var(--warning); font-size: 26rpx; }

.order-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16rpx; border-top: 1rpx solid var(--border); gap: 16rpx; }
.total { font-size: 24rpx; color: var(--text-light); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-group { display: flex; gap: 16rpx; flex-shrink: 0; }
.btn-action { padding: 12rpx 24rpx; border: 1rpx solid var(--border); border-radius: 28rpx; font-size: 24rpx; color: var(--text-secondary); }
.btn-action.primary { background: var(--primary); color: #fff; border-color: var(--primary); }

.loading { text-align: center; padding: 40rpx; color: var(--text-light); }

/* #ifdef H5 */
/* ==================== 桌面适配（任务 C3，仅 H5 编译，不进小程序包） ==================== */

/* H5 全宽度：100vh 未扣固定页头（窄屏 44px）、底部 tabBar（--window-bottom，宽屏为 0）
   与宽屏 topWindow 高度，页面会超高、列表在 scroll-view 外整页滚动，
   scrolltolower 永不触发（加载更多失效，验收流程 5）。统一扣除三者。 */
.page-order-list { height: calc(100vh - var(--window-top) - var(--window-bottom, 0px) - var(--top-window-height, 0px)); }

/* 放开 flex 子项 min-height:auto 的内容撑高，让列表滚动发生在 scroll-view 内部，
   触底才能触发 scrolltolower 加载更多（任务 C3 验证项，窄屏同样需要） */
.order-list { min-height: 0; }

/* ≥768px：订单列表（含卡片）限宽 1200px 居中；tabs 白条铺满全宽、项目居中（规划书 §4.6） */
.order-list {
  @include content-limit($content-max-page);
}

/* 桌面辅助内容（流程条 / 状态说明 / 常见问题）：窄屏一律隐藏，保持与小程序视觉一致 */
.desk-flow,
.desk-help { display: none; }

@include screen-tablet-up {
  .tabs { text-align: center; }
  .tab-item { padding: 28rpx 36rpx; }

  .order-card { padding: 32rpx; }
  .btn-action { padding: 14rpx 32rpx; }

  /* 流程提示条：蓝底渐变横幅，先解释「团队定制接单」怎么走 */
  .desk-flow {
    display: block;
    background: linear-gradient(135deg, #2979FF, #1565C0);
    border-radius: var(--radius);
    padding: 18px 24px;
    margin-bottom: 16px;
  }
  .df-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .df-title { color: #fff; font-size: 16px; font-weight: 700; }
  .df-sub { color: rgba(255, 255, 255, 0.78); font-size: 12px; }
  .df-steps { display: flex; align-items: center; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
  .df-step { background: rgba(255, 255, 255, 0.16); color: #fff; font-size: 12px; padding: 4px 12px; border-radius: 6px; }
  .df-arrow { color: rgba(255, 255, 255, 0.6); font-size: 12px; }

  /* 辅助信息双卡：状态说明 + 常见问题 */
  .desk-help {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin: 8px 0 24px;
  }
  .dh-card { background: #fff; border-radius: var(--radius); padding: 20px 24px; box-shadow: var(--shadow); }
  .dh-title { font-size: 15px; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 12px; }
  .dh-line { display: flex; gap: 12px; padding: 7px 0; align-items: baseline; }
  .dh-term { flex-shrink: 0; width: 64px; font-size: 13px; font-weight: 600; color: var(--primary); }
  .dh-text { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
  .dh-qa { padding: 7px 0; }
  .dh-q { display: block; font-size: 13px; font-weight: 600; color: var(--text-main); }
  .dh-a { display: block; font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-top: 4px; }
}

@include screen-desktop-up {
  /* 大桌面下单列说明行偏长，双卡内部略增留白 */
  .dh-card { padding: 24px 28px; }
}
/* #endif */
</style>
