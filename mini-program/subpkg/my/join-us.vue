<template>
  <view class="page-join">
    <!-- #ifdef H5 -->
    <!-- 桌面（≥768px）申请流程条：窄屏隐藏与小程序保持一致 -->
    <view class="desk-steps">
      <view class="ds-item">
        <text class="ds-num">1</text>
        <view class="ds-info">
          <text class="ds-name">提交申请</text>
          <text class="ds-desc">填写姓名、联系方式与擅长方向</text>
        </view>
      </view>
      <text class="ds-arrow">›</text>
      <view class="ds-item">
        <text class="ds-num">2</text>
        <view class="ds-info">
          <text class="ds-name">管理员审核</text>
          <text class="ds-desc">结合简介与作品说明评估</text>
        </view>
      </view>
      <text class="ds-arrow">›</text>
      <view class="ds-item">
        <text class="ds-num">3</text>
        <view class="ds-info">
          <text class="ds-name">通过后联系</text>
          <text class="ds-desc">创建团队账号并与你对接</text>
        </view>
      </view>
    </view>
    <!-- #endif -->

    <!-- 已有申请 -->
    <view class="card status-card" v-if="myApplication">
      <i :class="statusIcon" :style="{ fontSize: '80rpx', color: statusColor }" />
      <text class="st-title">{{ statusTitle }}</text>
      <text class="st-desc">{{ statusDesc }}</text>
      <view class="st-info">
        <view class="st-row"><text>姓名</text><text>{{ myApplication.name }}</text></view>
        <view class="st-row"><text>方向</text><text>{{ directionLabel(myApplication.direction) }}</text></view>
        <view class="st-row"><text>提交时间</text><text>{{ fmtDate(myApplication.created_at) }}</text></view>
        <view class="st-row" v-if="myApplication.admin_remark"><text>回复</text><text>{{ myApplication.admin_remark }}</text></view>
      </view>
      <button class="btn-again" v-if="myApplication.status === 'rejected'" @click="myApplication = null">重新申请</button>
    </view>

    <!-- 申请表单 -->
    <template v-else>
      <view class="intro-card">
        <text class="intro-title">加入我们的团队</text>
        <text class="intro-desc">我们是专注软件定制开发与电子产品代做的工作室，欢迎有软件或电子方向能力的伙伴加入。提交申请后管理员审核，通过后会与你联系。</text>
      </view>

      <view class="info-card">
        <view class="ic-row">
          <text class="ic-label">姓名</text>
          <input class="ic-input" v-model="form.name" placeholder="必填" placeholder-style="color:#ccc" />
        </view>
        <view class="ic-row">
          <text class="ic-label">联系方式</text>
          <input class="ic-input" v-model="form.contact" placeholder="微信/手机号，必填" placeholder-style="color:#ccc" />
        </view>
        <view class="ic-row">
          <text class="ic-label">方向</text>
          <view class="dir-options">
            <view v-for="d in directions" :key="d.key" class="dir-opt clickable" :class="{ active: form.direction === d.key }" @click="form.direction = d.key">
              {{ d.label }}
            </view>
          </view>
        </view>
        <view class="ic-row" style="align-items:flex-start;">
          <text class="ic-label">简介</text>
          <textarea class="ic-textarea" v-model="form.intro" placeholder="技术栈、经验年限、擅长领域等" :maxlength="500" placeholder-style="color:#ccc" />
        </view>
        <view class="ic-row" style="align-items:flex-start;">
          <text class="ic-label">作品说明</text>
          <textarea class="ic-textarea" v-model="form.works" placeholder="代表作品/项目链接/说明（选填）" :maxlength="500" placeholder-style="color:#ccc" />
        </view>
        <view class="ic-row" style="align-items:flex-start;">
          <text class="ic-label">附件</text>
          <view class="attach-box">
            <view class="attach-item" v-for="(f, i) in form.attachments" :key="i">
              <text class="attach-name">附件{{ i + 1 }}</text>
              <i class="ri-close-line clickable" style="font-size:28rpx;color:#999;" @click="form.attachments.splice(i, 1)" />
            </view>
            <view class="attach-add clickable" @click="addAttachment">
              <i class="ri-add-line" style="font-size:28rpx;color:#2979FF;" />
              <text>上传作品图（选填）</text>
            </view>
          </view>
        </view>
      </view>

      <view class="submit-bar">
        <button class="sb-btn" :disabled="!canSubmit || submitting" @click="submit">提交申请</button>
      </view>
    </template>

    <!-- #ifdef H5 -->
    <!-- 桌面（≥768px）申请须知：填充宽屏下表单列下方的空档 -->
    <view class="desk-faq">
      <text class="dfq-title">申请须知</text>
      <view class="dfq-item">
        <text class="dfq-q">需要什么方向的伙伴？</text>
        <text class="dfq-a">软件方向（小程序 / 网站 / 脚本工具 / 系统开发等）与电子方向（PCB、焊接组装、单片机、电路设计等），两者都会更佳。</text>
      </view>
      <view class="dfq-item">
        <text class="dfq-q">审核结果在哪里看？</text>
        <text class="dfq-a">管理员会尽快审核，结果会展示在本页，请保持申请中填写的联系方式畅通。</text>
      </view>
      <view class="dfq-item">
        <text class="dfq-q">未通过可以再申请吗？</text>
        <text class="dfq-a">可以。完善简介与作品说明后，可在本页重新提交申请。</text>
      </view>
    </view>
    <!-- #endif -->
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useAuthStore } from '@/store/auth.js';
import { api, uploadFile } from '@/api/request.js';

const authStore = useAuthStore();
const myApplication = ref(null);
const submitting = ref(false);

const form = ref({
  name: '',
  contact: '',
  direction: 'software',
  intro: '',
  works: '',
  attachments: [],
});

const directions = [
  { key: 'software', label: '软件' },
  { key: 'electronics', label: '电子' },
  { key: 'both', label: '都会' },
];

onShow(async () => {
  if (!authStore.isLogin) return;
  try {
    const list = await api.get('/recruit/my');
    // 展示最近一次申请状态
    myApplication.value = (list && list.length) ? list[0] : null;
  } catch (e) { console.log(e); }
});

const canSubmit = computed(() => form.value.name.trim() && form.value.contact.trim());

const statusTitle = computed(() => ({
  pending: '申请已提交',
  approved: '申请已通过',
  rejected: '申请未通过',
}[myApplication.value?.status] || ''));

const statusDesc = computed(() => ({
  pending: '管理员会尽快审核，请留意联系方式',
  approved: '欢迎加入！管理员会为你创建团队账号并联系你',
  rejected: '很遗憾本次未通过，可完善资料后重新申请',
}[myApplication.value?.status] || ''));

const statusIcon = computed(() => ({
  pending: 'ri-time-line',
  approved: 'ri-checkbox-circle-line',
  rejected: 'ri-close-circle-line',
}[myApplication.value?.status] || 'ri-time-line'));

const statusColor = computed(() => ({
  pending: '#FF9100',
  approved: '#00C853',
  rejected: '#FF3D00',
}[myApplication.value?.status] || '#FF9100'));

const directionLabel = (d) => ({ software: '软件', electronics: '电子', both: '软件+电子' }[d] || d);
const fmtDate = (d) => (d ? String(d).replace('T', ' ').slice(0, 16) : '');

const addAttachment = () => {
  uni.chooseImage({
    count: 3,
    success: async (res) => {
      for (const p of res.tempFilePaths) {
        try {
          const r = await uploadFile(p, 'file');
          form.value.attachments.push(r.url);
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
    myApplication.value = await api.post('/recruit/apply', {
      name: form.value.name.trim(),
      contact: form.value.contact.trim(),
      direction: form.value.direction,
      intro: form.value.intro.trim(),
      works: form.value.works.trim(),
      attachments: form.value.attachments,
    });
    uni.showToast({ title: '申请已提交', icon: 'success' });
  } catch (e) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.page-join { min-height: 100vh; background: var(--bg-page); padding-bottom: 140rpx; }

.card { background: #fff; border-radius: var(--radius); margin: 20rpx; box-shadow: var(--shadow); }
.status-card { padding: 60rpx 32rpx; display: flex; flex-direction: column; align-items: center; gap: 16rpx; }
.st-title { font-size: 34rpx; font-weight: 700; }
.st-desc { font-size: 26rpx; color: var(--text-secondary); text-align: center; }
.st-info { width: 100%; margin-top: 24rpx; border-top: 1rpx solid var(--border); padding-top: 12rpx; }
.st-row { display: flex; justify-content: space-between; padding: 14rpx 0; font-size: 26rpx; color: var(--text-secondary); }
.btn-again { margin-top: 24rpx; background: #fff; color: var(--primary); border: 2rpx solid var(--primary); border-radius: 40rpx; font-size: 28rpx; padding: 12rpx 48rpx; line-height: 1.5; }

.intro-card { margin: 20rpx 24rpx; padding: 36rpx 32rpx; border-radius: 20rpx; background: linear-gradient(135deg, #2979FF, #1565C0); }
.intro-title { color: #fff; font-size: 36rpx; font-weight: 700; display: block; }
.intro-desc { color: rgba(255,255,255,0.85); font-size: 24rpx; line-height: 1.7; display: block; margin-top: 14rpx; }

.info-card { background: #fff; margin: 0 24rpx; border-radius: 20rpx; padding: 12rpx 24rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,.04); }
.ic-row { display: flex; align-items: center; gap: 20rpx; padding: 24rpx 0; border-bottom: 1rpx solid #F5F5F5; }
.ic-row:last-child { border-bottom: none; }
.ic-label { width: 130rpx; font-size: 28rpx; color: var(--text-main); flex-shrink: 0; }
.ic-input { flex: 1; font-size: 28rpx; }
.ic-textarea { flex: 1; font-size: 28rpx; min-height: 120rpx; }
.dir-options { flex: 1; display: flex; gap: 14rpx; }
.dir-opt { padding: 12rpx 32rpx; background: #F5F6FA; border-radius: 12rpx; font-size: 26rpx; color: #333; }
.dir-opt.active { background: #E3F2FD; color: #1565C0; font-weight: 600; border: 2rpx solid #2979FF; }

.attach-box { flex: 1; display: flex; flex-direction: column; gap: 12rpx; }
.attach-item { display: flex; justify-content: space-between; align-items: center; background: #F5F8FF; border-radius: 10rpx; padding: 14rpx 20rpx; }
.attach-name { font-size: 24rpx; color: #2979FF; }
.attach-add { display: flex; align-items: center; gap: 8rpx; font-size: 24rpx; color: #2979FF; padding: 10rpx 0; }

.submit-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 16rpx 28rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); display: flex; box-shadow: 0 -4rpx 20rpx rgba(0,0,0,.06); }
.sb-btn { flex: 1; height: 88rpx; line-height: 88rpx; background: linear-gradient(135deg, #2979FF, #1565C0); color: #fff; font-size: 32rpx; border-radius: 44rpx; border: none; font-weight: 600; padding: 0; text-align: center; }
.sb-btn[disabled] { background: #ddd; color: #999; }

/* #ifdef H5 */
/* ==================== 桌面适配（规划书 §4.12 / 任务 D4，仅 H5 编译，不进小程序包） ==================== */
/* 介绍卡、表单卡、申请状态卡统一居中 760px，底部提交条与表单同宽对齐 */
.status-card { @include content-limit($content-max-form); }
.intro-card { @include content-limit($content-max-form); }
.info-card { @include content-limit($content-max-form); }
.desk-steps { @include content-limit($content-max-form); }
.desk-faq { @include content-limit($content-max-form); }
.submit-bar { @include fixed-bar-limit($content-max-form); }

/* 桌面辅助内容（流程条 / 申请须知）：窄屏一律隐藏，保持与小程序视觉一致 */
.desk-steps,
.desk-faq { display: none; }

@media (min-width: $bp-tablet) {
  /* 100vh 未扣页头与 topWindow 高度会使短内容页凭空多出约 105px 空滚动 */
  .page-join { min-height: calc(100vh - var(--window-top) - var(--top-window-height, 0px)); box-sizing: border-box; }
  .status-card { margin-top: 16px; }
  .intro-card { margin-top: 16px; }
  .info-card { padding: 8px 24px; }
  /* 桌面下给简介/作品说明更高的输入区，避免大屏上输入过矮 */
  .ic-textarea { min-height: 120px; }
  .submit-bar { border-radius: 12px 12px 0 0; padding: 12px 24px; }
  .sb-btn { max-width: 320px; margin: 0 auto; }

  /* 申请流程三步条 */
  .desk-steps { display: flex; align-items: center; gap: 12px; background: #fff; border-radius: 12px; padding: 18px 24px; margin-top: 24px; box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04); }
  .ds-item { flex: 1; display: flex; align-items: center; gap: 10px; min-width: 0; }
  .ds-num { width: 26px; height: 26px; line-height: 26px; text-align: center; border-radius: 50%; background: var(--primary-light); color: var(--primary-dark); font-size: 13px; font-weight: 700; flex-shrink: 0; }
  .ds-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .ds-name { font-size: 14px; font-weight: 600; color: var(--text-main); }
  .ds-desc { font-size: 12px; color: var(--text-light); line-height: 1.5; }
  .ds-arrow { color: #ccc; font-size: 16px; flex-shrink: 0; }

  /* 申请须知问答卡 */
  .desk-faq { display: block; background: #fff; border-radius: 12px; padding: 20px 24px; margin: 20px auto 40px; box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04); }
  .dfq-title { display: block; font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 8px; }
  .dfq-item { padding: 8px 0; }
  .dfq-q { display: block; font-size: 13px; font-weight: 600; color: var(--text-main); }
  .dfq-a { display: block; font-size: 13px; color: var(--text-secondary); line-height: 1.7; margin-top: 4px; }
}
/* #endif */
</style>
