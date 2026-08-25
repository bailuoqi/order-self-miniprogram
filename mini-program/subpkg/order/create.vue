<template>
  <view class="page-create" v-if="product">
    <!-- 服务摘要 -->
    <view class="goods-card">
      <image class="gc-img" :src="product.cover" mode="aspectFill" />
      <view class="gc-info">
        <text class="gc-name">{{ product.title }}</text>
        <text class="gc-spec">{{ product.delivery_days ? '参考工期：' + product.delivery_days : '' }}</text>
        <view class="gc-price-row">
          <text class="gc-price">¥{{ fmtPrice(product.price) }} 起</text>
        </view>
      </view>
    </view>

    <!-- 流程提示 -->
    <view class="flow-tip">
      <i class="ri-information-line" style="font-size:28rpx;color:#FF9100;" />
      <text>提交后团队会先报价，双方确认后支付定金开工，此价格仅供参考</text>
    </view>

    <!-- 需求信息 -->
    <view class="info-card">
      <view class="ic-title">需求信息</view>
      <view class="ic-row" style="align-items:flex-start;">
        <view class="ic-icon"><i class="ri-chat-3-line" style="font-size:36rpx;color:#2979FF;" /></view>
        <textarea class="ic-textarea" v-model="requirement" placeholder="请描述您的具体需求（功能点、参数、参考资料等）" :maxlength="1000" placeholder-style="color:#ccc" />
      </view>
      <view class="ic-row">
        <view class="ic-icon"><i class="ri-user-3-line" style="font-size:36rpx;color:#00C853;" /></view>
        <input class="ic-input" v-model="contact" placeholder="联系方式（微信/手机号，必填）" placeholder-style="color:#ccc" />
      </view>
      <view class="ic-row">
        <view class="ic-icon"><i class="ri-calendar-2-line" style="font-size:36rpx;color:#FF9100;" /></view>
        <input class="ic-input" v-model="expectedDays" placeholder="期望工期（如：15天内，选填）" placeholder-style="color:#ccc" />
      </view>
      <!-- 附件 -->
      <view class="ic-row" style="align-items:flex-start;">
        <view class="ic-icon"><i class="ri-attachment-2" style="font-size:36rpx;color:#999;" /></view>
        <view class="attach-box">
          <view class="attach-item" v-for="(f, i) in attachments" :key="i">
            <text class="attach-name">附件{{ i + 1 }}</text>
            <i class="ri-close-line clickable" style="font-size:28rpx;color:#999;" @click="attachments.splice(i, 1)" />
          </view>
          <view class="attach-add clickable" @click="addAttachment">
            <i class="ri-add-line" style="font-size:28rpx;color:#2979FF;" />
            <text>添加附件（选填）</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 提交 -->
    <view class="submit-bar">
      <button class="sb-btn" :disabled="!contact || submitting" @click="submitOrder">提交需求，等待报价</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useProductStore } from '@/store/product.js';
import { useOrderStore } from '@/store/order.js';
import { uploadFile } from '@/api/request.js';

const productStore = useProductStore();
const orderStore = useOrderStore();
const product = ref(null);
const requirement = ref('');
const contact = ref('');
const expectedDays = ref('');
const attachments = ref([]);
const submitting = ref(false);

onLoad(async (options) => {
  await productStore.fetchDetail(options.productId);
  product.value = productStore.current;
});

const fmtPrice = (fen) => ((fen || 0) / 100).toFixed(2);

const addAttachment = () => {
  uni.chooseImage({
    count: 3,
    success: async (res) => {
      for (const p of res.tempFilePaths) {
        try {
          const r = await uploadFile(p, 'file');
          attachments.value.push(r.url);
        } catch (e) {
          uni.showToast({ title: '上传失败', icon: 'none' });
        }
      }
    },
  });
};

const submitOrder = async () => {
  if (!contact.value.trim()) {
    uni.showToast({ title: '请填写联系方式', icon: 'none' });
    return;
  }
  if (submitting.value) return;
  submitting.value = true;
  try {
    const order = await orderStore.createOrder({
      product_id: product.value.id,
      requirement: requirement.value,
      contact: contact.value,
      expected_days: expectedDays.value,
      attachments: attachments.value,
    });
    uni.redirectTo({ url: '/subpkg/order/detail?id=' + order.id });
    uni.showToast({ title: '已提交，等待团队报价', icon: 'success' });
  } catch (e) {
    uni.showToast({ title: '提交失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.page-create { min-height: 100vh; background: #F5F6FA; padding-bottom: 140rpx; }

.goods-card {
  display: flex; gap: 20rpx; background: #fff; margin: 20rpx 24rpx; padding: 24rpx;
  border-radius: 20rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,.04);
}
.gc-img { width: 140rpx; height: 140rpx; border-radius: 14rpx; background: linear-gradient(135deg,#E3F2FD,#BBDEFB); }
.gc-info { flex: 1; display: flex; flex-direction: column; gap: 8rpx; }
.gc-name { font-size: 28rpx; font-weight: 600; line-height: 1.4; }
.gc-spec { font-size: 24rpx; color: #999; }
.gc-price-row { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
.gc-price { font-size: 32rpx; color: #FF3D00; font-weight: 700; }

.flow-tip { display: flex; align-items: center; gap: 10rpx; margin: 0 24rpx 20rpx; padding: 18rpx 22rpx; background: #FFF8E1; border-radius: 14rpx; font-size: 24rpx; color: #E65100; line-height: 1.5; }

.info-card { background: #fff; margin: 0 24rpx; border-radius: 20rpx; padding: 28rpx 24rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,.04); }
.ic-title { font-size: 30rpx; font-weight: 700; margin-bottom: 20rpx; }
.ic-row { display: flex; align-items: center; gap: 16rpx; padding: 20rpx 0; border-bottom: 1rpx solid #F5F5F5; }
.ic-row:last-child { border-bottom: none; }
.ic-icon { width: 56rpx; height: 56rpx; border-radius: 50%; background: #F5F6FA; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ic-input { flex: 1; font-size: 26rpx; }
.ic-textarea { flex: 1; font-size: 26rpx; min-height: 140rpx; }

.attach-box { flex: 1; display: flex; flex-direction: column; gap: 12rpx; }
.attach-item { display: flex; justify-content: space-between; align-items: center; background: #F5F8FF; border-radius: 10rpx; padding: 14rpx 20rpx; }
.attach-name { font-size: 24rpx; color: #2979FF; }
.attach-add { display: flex; align-items: center; gap: 8rpx; font-size: 24rpx; color: #2979FF; padding: 10rpx 0; }

.submit-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 16rpx 28rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); display: flex; align-items: center; gap: 20rpx; box-shadow: 0 -4rpx 20rpx rgba(0,0,0,.06); }
.sb-btn { flex: 1; height: 88rpx; line-height: 88rpx; background: linear-gradient(135deg, #2979FF, #1565C0); color: #fff; font-size: 32rpx; border-radius: 44rpx; border: none; font-weight: 600; padding: 0; text-align: center; }
.sb-btn[disabled] { background: #ddd; color: #999; }

/* #ifdef H5 */
/* ==================== 桌面适配（任务 C2，仅 H5 编译，不进小程序包） ==================== */

/* ≥768px：表单列居中 760px，与发布需求页（C1）同规格（规划书 §4.5） */
.goods-card,
.flow-tip,
.info-card {
  @include content-limit($content-max-form);
}

/* 底部提交条限宽 760px，与表单列对齐 */
.submit-bar {
  @include fixed-bar-limit($content-max-form);
}

@include screen-tablet-up {
  .info-card { padding: 32rpx 36rpx; }

  /* 大屏输入区加高，避免桌面上输入框过矮 */
  .ic-textarea { min-height: 160px; }

  /* 限宽悬浮的提交条补顶部圆角 */
  .submit-bar { border-radius: 16px 16px 0 0; }
}
/* #endif */
</style>
