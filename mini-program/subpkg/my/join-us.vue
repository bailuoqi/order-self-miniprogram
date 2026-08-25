<template>
  <view class="page-join">
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
            <view v-for="d in directions" :key="d.key" class="dir-opt" :class="{ active: form.direction === d.key }" @click="form.direction = d.key">
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
              <i class="ri-close-line" style="font-size:28rpx;color:#999;" @click="form.attachments.splice(i, 1)" />
            </view>
            <view class="attach-add" @click="addAttachment">
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
</style>
