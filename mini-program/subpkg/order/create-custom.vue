<template>
  <view class="page-custom">
    <!-- 流程提示 -->
    <view class="flow-tip">
      <i class="ri-information-line" style="font-size:28rpx;color:#FF9100;" />
      <text>提交需求 → 团队报价 → 确认后付定金开工 → 交付后结尾款</text>
    </view>

    <view class="info-card">
      <view class="ic-title">需求信息</view>

      <!-- 品类 -->
      <view class="ic-row clickable" @click="showCategoryPicker">
        <view class="ic-icon"><i class="ri-apps-2-line" style="font-size:36rpx;color:#2979FF;" /></view>
        <view class="ic-content">
          <text class="ic-label">品类（必选）</text>
          <text :class="selectedCategory ? 'ic-value' : 'ic-placeholder'">
            {{ selectedCategory ? selectedCategory.name : '请选择：软件定制 / 电子代做' }}
          </text>
        </view>
        <i class="ri-arrow-right-s-line" style="font-size:28rpx;color:#ccc;" />
      </view>

      <!-- 标题 -->
      <view class="ic-row">
        <view class="ic-icon"><i class="ri-edit-line" style="font-size:36rpx;color:#00C853;" /></view>
        <input class="ic-input" v-model="title" placeholder="需求标题（如：开发一个预约小程序）" :maxlength="50" placeholder-style="color:#ccc" />
      </view>

      <!-- 描述 -->
      <view class="ic-row" style="align-items:flex-start;">
        <view class="ic-icon"><i class="ri-chat-3-line" style="font-size:36rpx;color:#FF6D00;" /></view>
        <textarea class="ic-textarea" v-model="requirement" placeholder="需求描述（必填）：功能点、技术要求、参考案例、数量等，描述越清楚报价越快" :maxlength="2000" placeholder-style="color:#ccc" />
      </view>

      <!-- 联系方式 -->
      <view class="ic-row">
        <view class="ic-icon"><i class="ri-user-3-line" style="font-size:36rpx;color:#AA00FF;" /></view>
        <input class="ic-input" v-model="contact" placeholder="联系方式（微信/手机号，必填）" placeholder-style="color:#ccc" />
      </view>

      <!-- 期望工期 -->
      <view class="ic-row">
        <view class="ic-icon"><i class="ri-calendar-2-line" style="font-size:36rpx;color:#FF9100;" /></view>
        <input class="ic-input" v-model="expectedDays" placeholder="期望工期（如：30天内，必填）" placeholder-style="color:#ccc" />
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
            <text>添加附件：原理图/参考图等（选填）</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 合规提示 -->
    <view class="notice-text">
      <text>· 我们只承接合法合规的技能服务与定制开发</text>
      <text>· 不承接作业代写、论文代写、替考、刷分等业务</text>
    </view>

    <!-- #ifdef H5 -->
    <!-- 桌面（≥768px）填写指引：窄屏隐藏与小程序保持一致 -->
    <view class="desk-form-tips">
      <text class="dft-title">怎样描述需求，报价更快？</text>
      <text class="dft-line">· 软件类：写清功能清单、期望平台（小程序 / 网站 / 脚本工具）与参考案例</text>
      <text class="dft-line">· 电子类：写清用途场景、数量，有原理图或参考实物可作为附件上传</text>
      <text class="dft-line">· 附上预算范围与期望工期，团队能更快给出准确报价</text>
      <text class="dft-line">· 文档类资料（pdf / 压缩包）可在下单后的聊天里留链接说明</text>
    </view>
    <!-- #endif -->

    <!-- 提交 -->
    <view class="submit-bar">
      <button class="sb-btn" :disabled="!canSubmit || submitting" @click="submit">发布需求，等待报价</button>
    </view>

    <!-- 品类选择弹窗 -->
    <view class="cat-popup" v-if="pickerVisible" @click="pickerVisible = false">
      <view class="cat-panel" @click.stop>
        <view class="popup-header">
          <text class="popup-title">选择品类</text>
          <i class="ri-close-line clickable" style="font-size:40rpx;color:#999;" @click="pickerVisible = false" />
        </view>
        <view v-for="group in categoryGroups" :key="group.key" class="cat-group">
          <text class="cat-group-title">{{ group.title }}</text>
          <view class="cat-options">
            <view v-for="c in group.items" :key="c.id" class="cat-opt clickable" :class="{ active: selectedCategory && selectedCategory.id === c.id }" @click="pickCategory(c)">
              {{ c.name }}
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useCategoryStore } from '@/store/category.js';
import { useOrderStore } from '@/store/order.js';
import { useAuthStore } from '@/store/auth.js';
import { uploadFile } from '@/api/request.js';

const categoryStore = useCategoryStore();
const orderStore = useOrderStore();
const authStore = useAuthStore();

const title = ref('');
const requirement = ref('');
const contact = ref('');
const expectedDays = ref('');
const attachments = ref([]);
const selectedCategory = ref(null);
const pickerVisible = ref(false);
const submitting = ref(false);
const categoryGroups = ref([]);

onLoad(async () => {
  try {
    await categoryStore.fetchAll();
    const list = categoryStore.list || [];
    categoryGroups.value = [
      { key: 'software', title: '软件定制', items: list.filter(c => c.group === 'software') },
      { key: 'electronics', title: '电子代做', items: list.filter(c => c.group === 'electronics') },
    ].filter(g => g.items.length);
  } catch (e) { console.log(e); }
});

const canSubmit = computed(() =>
  selectedCategory.value && title.value.trim() && requirement.value.trim() && contact.value.trim() && expectedDays.value.trim()
);

const showCategoryPicker = () => { pickerVisible.value = true; };
const pickCategory = (c) => {
  selectedCategory.value = c;
  pickerVisible.value = false;
};

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

const submit = async () => {
  if (!authStore.isLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  if (!canSubmit.value || submitting.value) return;
  submitting.value = true;
  try {
    const order = await orderStore.createCustomOrder({
      category_id: selectedCategory.value.id,
      title: title.value.trim(),
      requirement: requirement.value.trim(),
      contact: contact.value.trim(),
      expected_days: expectedDays.value.trim(),
      attachments: attachments.value,
    });
    uni.redirectTo({ url: '/subpkg/order/detail?id=' + order.id });
    uni.showToast({ title: '已发布，等待团队报价', icon: 'success' });
  } catch (e) {
    uni.showToast({ title: '发布失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.page-custom { min-height: 100vh; background: #F5F6FA; padding-bottom: 140rpx; }

.flow-tip { display: flex; align-items: center; gap: 10rpx; margin: 20rpx 24rpx; padding: 18rpx 22rpx; background: #FFF8E1; border-radius: 14rpx; font-size: 24rpx; color: #E65100; line-height: 1.5; }

.info-card { background: #fff; margin: 0 24rpx; border-radius: 20rpx; padding: 28rpx 24rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,.04); }
.ic-title { font-size: 30rpx; font-weight: 700; margin-bottom: 20rpx; }
.ic-row { display: flex; align-items: center; gap: 16rpx; padding: 20rpx 0; border-bottom: 1rpx solid #F5F5F5; }
.ic-row:last-child { border-bottom: none; }
.ic-icon { width: 56rpx; height: 56rpx; border-radius: 50%; background: #F5F6FA; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ic-content { flex: 1; display: flex; flex-direction: column; }
.ic-label { font-size: 24rpx; color: #999; }
.ic-value { font-size: 28rpx; color: #333; font-weight: 500; margin-top: 4rpx; }
.ic-placeholder { font-size: 26rpx; color: #ccc; margin-top: 4rpx; }
.ic-input { flex: 1; font-size: 26rpx; }
.ic-textarea { flex: 1; font-size: 26rpx; min-height: 180rpx; }

.attach-box { flex: 1; display: flex; flex-direction: column; gap: 12rpx; }
.attach-item { display: flex; justify-content: space-between; align-items: center; background: #F5F8FF; border-radius: 10rpx; padding: 14rpx 20rpx; }
.attach-name { font-size: 24rpx; color: #2979FF; }
.attach-add { display: flex; align-items: center; gap: 8rpx; font-size: 24rpx; color: #2979FF; padding: 10rpx 0; }

.notice-text { display: flex; flex-direction: column; gap: 8rpx; margin: 20rpx 32rpx; font-size: 22rpx; color: #999; line-height: 1.5; }

.submit-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 16rpx 28rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); display: flex; box-shadow: 0 -4rpx 20rpx rgba(0,0,0,.06); }
.sb-btn { flex: 1; height: 88rpx; line-height: 88rpx; background: linear-gradient(135deg, #2979FF, #1565C0); color: #fff; font-size: 32rpx; border-radius: 44rpx; border: none; font-weight: 600; padding: 0; text-align: center; }
.sb-btn[disabled] { background: #ddd; color: #999; }

.cat-popup { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: flex-end; z-index: 200; }
.cat-panel { width: 100%; background: #fff; border-radius: 32rpx 32rpx 0 0; padding: 36rpx 28rpx; padding-bottom: calc(36rpx + env(safe-area-inset-bottom)); max-height: 70vh; overflow-y: auto; }
.popup-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.popup-title { font-size: 32rpx; font-weight: 700; }
.cat-group { margin-bottom: 24rpx; }
.cat-group-title { font-size: 26rpx; font-weight: 600; color: #666; display: block; margin-bottom: 14rpx; }
.cat-options { display: flex; flex-wrap: wrap; gap: 14rpx; }
.cat-opt { padding: 14rpx 28rpx; background: #F5F6FA; border-radius: 12rpx; font-size: 26rpx; color: #333; }
.cat-opt.active { background: #E3F2FD; color: #1565C0; font-weight: 600; border: 2rpx solid #2979FF; }

/* #ifdef H5 */
/* ==================== 桌面适配（任务 C1，仅 H5 编译，不进小程序包） ==================== */

/* ≥768px：表单列居中 760px，页面背景仍铺满全宽（规划书 §4.5） */
.flow-tip,
.info-card,
.notice-text,
.desk-form-tips {
  @include content-limit($content-max-form);
}

/* 底部提交条限宽 760px，与表单列对齐 */
.submit-bar {
  @include fixed-bar-limit($content-max-form);
}

/* 桌面填写指引：窄屏一律隐藏，保持与小程序视觉一致 */
.desk-form-tips { display: none; }

@include screen-tablet-up {
  .info-card { padding: 32rpx 36rpx; }

  /* 填写指引卡：帮助电脑用户一次把需求写完整 */
  .desk-form-tips { display: flex; flex-direction: column; gap: 6px; background: #fff; border-radius: 12px; padding: 18px 22px; margin-top: 16px; box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04); }
  .dft-title { font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 2px; }
  .dft-line { font-size: 12px; color: var(--text-secondary); line-height: 1.8; }

  /* 大屏输入区加高，避免桌面上输入框过矮 */
  .ic-textarea { min-height: 200px; }

  /* 限宽悬浮的提交条补顶部圆角 */
  .submit-bar { border-radius: 16px 16px 0 0; }

  /* 品类选择弹窗：底部抽屉 → 居中模态（仅改定位，不改逻辑） */
  .cat-popup { align-items: center; justify-content: center; padding: 24px; }
  .cat-panel {
    width: 560px;
    max-width: 100%;
    border-radius: 16px;
    padding: 32rpx;
    max-height: 72vh;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.16);
  }
}
/* #endif */
</style>
