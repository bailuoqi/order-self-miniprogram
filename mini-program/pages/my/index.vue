<template>
  <view class="page-my">
    <!-- 头部 -->
    <view class="header" :style="{ paddingTop: statusBarHeight + 30 + 'px' }">
      <view class="header-bg" />
      <view class="header-content">
        <!-- 未登录 -->
        <view class="user-card" v-if="!isLogin">
          <image class="uc-avatar" src="/static/icons/default-avatar.png" mode="aspectFill" />
          <view class="uc-info">
            <text class="uc-name">点击登录</text>
            <text class="uc-desc">登录后可下单和查看进度</text>
          </view>
          <!-- #ifndef H5 -->
          <button class="phone-login-btn" open-type="getPhoneNumber" @getphonenumber="onGetPhone">
            微信一键登录
          </button>
          <!-- #endif -->
          <!-- #ifdef H5 -->
          <button class="phone-login-btn" @click="h5Login">体验登录</button>
          <!-- #endif -->
        </view>
        <!-- 已登录 -->
        <view class="user-card clickable" v-else @click="goEditProfile">
          <image class="uc-avatar" :src="userInfo.avatar || '/static/icons/default-avatar.png'" mode="aspectFill" />
          <view class="uc-info">
            <text class="uc-name">{{ userInfo.nickname }}</text>
            <text class="uc-desc">{{ userInfo.phone || '未绑定手机号' }}</text>
          </view>
          <view class="uc-edit">
            <i class="ri-pencil-line" style="font-size:28rpx;color:#fff;" />
          </view>
        </view>

        <!-- 订单统计 -->
        <view class="header-stats" v-if="isLogin">
          <view class="stat-item clickable" @click="goOrders('pending_quote,quoting')">
            <text class="stat-num">{{ stats.quoting }}</text>
            <text class="stat-label">待报价</text>
          </view>
          <view class="stat-divider" />
          <view class="stat-item clickable" @click="goOrders('confirmed,delivered')">
            <text class="stat-num">{{ stats.toPay }}</text>
            <text class="stat-label">待付款</text>
          </view>
          <view class="stat-divider" />
          <view class="stat-item clickable" @click="goOrders('deposit_paid')">
            <text class="stat-num">{{ stats.making }}</text>
            <text class="stat-label">制作中</text>
          </view>
          <view class="stat-divider" />
          <view class="stat-item clickable" @click="goOrders('')">
            <text class="stat-num">{{ stats.total }}</text>
            <text class="stat-label">全部订单</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="section">
      <view class="section-title">服务</view>
      <view class="menu-grid">
        <view class="menu-item hover-lift" @click="goPage('/subpkg/order/create-custom')">
          <i class="ri-add-circle-line menu-icon" style="color:#2979FF;" />
          <text class="menu-text">发布需求</text>
        </view>
        <view class="menu-item hover-lift" @click="goCategory">
          <i class="ri-file-list-3-line menu-icon" style="color:#FF6D00;" />
          <text class="menu-text">标准服务</text>
        </view>
        <view class="menu-item hover-lift" @click="goPage('/subpkg/my/join-us')">
          <i class="ri-team-line menu-icon" style="color:#00C853;" />
          <text class="menu-text">加入我们</text>
        </view>
        <view class="menu-item hover-lift" @click="goAbout">
          <i class="ri-customer-service-2-line menu-icon" style="color:#AA00FF;" />
          <text class="menu-text">联系客服</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">其他</view>
      <view class="menu-list">
        <view class="menu-row clickable" @click="goPage('/subpkg/my/refund-list')">
          <text>退款记录</text>
          <i class="ri-arrow-right-s-line" />
        </view>
        <view class="menu-row clickable" @click="goPage('/subpkg/my/settings')">
          <text>设置</text>
          <i class="ri-arrow-right-s-line" />
        </view>
        <view class="menu-row clickable" @click="goAbout">
          <text>关于我们</text>
          <i class="ri-arrow-right-s-line" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useAuthStore } from '@/store/auth.js';
import { api } from '@/api/request.js';

const authStore = useAuthStore();
const userInfo = ref({});
const statusBarHeight = ref(44);
const stats = ref({ quoting: 0, toPay: 0, making: 0, total: 0 });
const isLogin = computed(() => authStore.isLogin);

onShow(async () => {
  userInfo.value = authStore.userInfo || {};
  if (authStore.isLogin) {
    try {
      const res = await api.get('/orders/my', { page: 1, pageSize: 100 });
      const list = res.list || [];
      stats.value = {
        total: res.total || list.length,
        quoting: list.filter(o => ['pending_quote', 'quoting'].includes(o.status)).length,
        toPay: list.filter(o => ['confirmed', 'delivered'].includes(o.status)).length,
        making: list.filter(o => o.status === 'deposit_paid').length,
      };
    } catch (e) { console.log(e); }
  }
  uni.getSystemInfo({ success: s => statusBarHeight.value = s.statusBarHeight || 44 });
});

/** 微信一键登录 + 获取手机号 */
const onGetPhone = async (e) => {
  if (e.detail.errMsg !== 'getPhoneNumber:ok') return;
  try {
    // 1. 获取手机号
    const phoneRes = await uni.request({
      url: uni.getStorageSync('apiBase') + '/api/auth/wx-phone',
      method: 'POST',
      data: { code: e.detail.code },
    });
    const phone = phoneRes.data.phone;

    // 2. 微信登录
    const loginRes = await uni.login();
    await authStore.wxLogin(loginRes.code, '', '');

    // 3. 绑定手机号
    await authStore.updateProfile({ phone });
    userInfo.value = authStore.userInfo;
    uni.showToast({ title: '登录成功', icon: 'success' });
  } catch (err) {
    uni.showToast({ title: '登录失败', icon: 'none' });
  }
};

/** H5 体验登录（开发环境） */
const h5Login = async () => {
  try {
    await authStore.devLogin();
    userInfo.value = authStore.userInfo;
    uni.showToast({ title: '登录成功', icon: 'success' });
  } catch (e) {
    uni.showToast({ title: '登录失败', icon: 'none' });
  }
};

const goPage = (url) => {
  if (!authStore.isLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  uni.navigateTo({ url });
};

const goOrders = () => uni.switchTab({ url: '/pages/order/list' });
const goCategory = () => uni.navigateTo({ url: '/subpkg/category/index' });
const goAbout = () => uni.navigateTo({ url: '/subpkg/my/about' });
const goEditProfile = () => uni.navigateTo({ url: '/subpkg/my/settings' });
</script>

<style lang="scss" scoped>
.page-my { min-height: 100vh; background: var(--bg); padding-bottom: 120rpx; }
.header { position: relative; overflow: hidden; padding-bottom: 30rpx; }
.header-bg { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: linear-gradient(135deg, #2979FF 0%, #1565C0 100%); border-radius: 0 0 50% 50%; transform: scaleX(1.5); }
.header-content { position: relative; z-index: 1; padding: 0 32rpx 40rpx; }
.user-card { display: flex; align-items: center; gap: 20rpx; }
.uc-avatar { width: 120rpx; height: 120rpx; border-radius: 50%; border: 4rpx solid rgba(255,255,255,.3); background: #eee; }
.uc-info { flex: 1; }
.uc-name { font-size: 36rpx; font-weight: 700; color: #fff; display: block; }
.uc-desc { font-size: 24rpx; color: rgba(255,255,255,.7); margin-top: 8rpx; display: block; }
.uc-edit { padding: 10rpx; }
.phone-login-btn { background: #fff; color: #2979FF; font-size: 26rpx; padding: 12rpx 28rpx; border-radius: 32rpx; border: none; line-height: 1.4; font-weight: 600; }

.header-stats { display: flex; margin-top: 32rpx; background: rgba(255,255,255,.15); border-radius: 16rpx; padding: 24rpx; }
.stat-item { flex: 1; text-align: center; }
.stat-num { font-size: 40rpx; font-weight: 700; color: #fff; display: block; }
.stat-label { font-size: 22rpx; color: rgba(255,255,255,.7); margin-top: 6rpx; display: block; }
.stat-divider { width: 1rpx; background: rgba(255,255,255,.2); }

.section { margin: 24rpx 32rpx; }
.section-title { font-size: 28rpx; font-weight: 700; color: var(--text-main); margin-bottom: 16rpx; }
.menu-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16rpx; }
.menu-item { background: #fff; border-radius: 16rpx; padding: 28rpx 0; text-align: center; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.04); }
.menu-icon { font-size: 48rpx; display: block; margin-bottom: 10rpx; }
.menu-text { font-size: 24rpx; color: var(--text-secondary); }

.menu-list { background: #fff; border-radius: 16rpx; overflow: hidden; }
.menu-row { display: flex; justify-content: space-between; align-items: center; padding: 28rpx 32rpx; font-size: 28rpx; color: var(--text-main); border-bottom: 1rpx solid var(--border); }
.menu-row:last-child { border-bottom: none; }

/* #ifdef H5 */
/* ==================== 桌面适配（规划书 §4.11 / 任务 D3，仅 H5 编译，不进小程序包） ==================== */
@media (min-width: $bp-tablet) {
  /* 宽屏下 scaleX 弧形头部失真，改为平底渐变条；顶部留白不再按手机状态栏计算（覆盖内联 padding-top） */
  .header { padding-top: 28px !important; padding-bottom: 4px; }
  .header-bg { top: 0; left: 0; width: 100%; height: 100%; transform: none; border-radius: 0; }
  /* 渐变背景铺满全宽，头部内容与下方区块限宽 1200px 居中 */
  .header-content { max-width: $content-max-page; margin: 0 auto; padding: 0 24px 28px; box-sizing: border-box; }
  .section { width: 100%; max-width: $content-max-page; margin: 24px auto 0; padding: 0 24px; box-sizing: border-box; }
  /* 100vh 未扣 topWindow 高度会使短内容页凭空多出约 60px 空滚动 */
  .page-my { padding-bottom: 48px; min-height: calc(100vh - var(--window-top) - var(--top-window-height, 0px)); box-sizing: border-box; }
}

@media (min-width: $bp-desktop) {
  /* ≥1200px：「服务」宫格与「其他」列表两列并排（1fr 侧边栏挤压出居中的 1200px 内容区） */
  .page-my { display: grid; grid-template-columns: 1fr minmax(0, 600px) minmax(0, 600px) 1fr; align-content: start; }
  .header { grid-column: 1 / -1; }
  .section { width: auto; max-width: none; padding: 0; }
  .section:nth-child(2) { grid-column: 2; margin: 24px 12px 0 24px; }
  .section:nth-child(3) { grid-column: 3; margin: 24px 24px 0 12px; }
  .menu-item { padding: 22px 0; }
}
/* #endif */
</style>
