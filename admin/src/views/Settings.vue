<template>
<div><div class="page-hd"><h2>系统配置</h2></div>
<div class="card" style="max-width:600px">
  <div v-if="loading" class="loading-tip"><i class="ri-loader-4-line spin"></i> 正在加载服务器配置…</div>
  <template v-else>
    <div v-if="migrated" class="tip-bar tip-warn"><i class="ri-information-line"></i> 检测到本浏览器存有旧版本地配置，已为你预填，点击「保存配置」即可迁移到服务器。</div>
    <div class="form-group"><label class="form-label">团队/品牌名称</label><input class="form-input" v-model="brandName" placeholder="如：定制接单" /></div>
    <div class="form-group"><label class="form-label">默认定金比例 (%)</label><input class="form-input" type="number" min="0" max="100" v-model="depositRatio" />
      <p class="field-tip">用于订单报价时定金金额的预填（0–100）</p></div>
    <div class="form-group"><label class="form-label">客服电话</label><input class="form-input" v-model="servicePhone" placeholder="如：400-888-8888" /></div>
    <div class="save-row">
      <button class="btn btn-primary" :disabled="saving" @click="save"><i class="ri-save-line"></i> {{ saving ? '保存中…' : '保存配置' }}</button>
      <span v-if="savedTip" class="save-tip ok"><i class="ri-checkbox-circle-fill"></i> 已保存到服务器</span>
      <span v-if="errorTip" class="save-tip err"><i class="ri-close-circle-fill"></i> {{ errorTip }}</span>
    </div>
    <p class="page-note"><i class="ri-error-warning-line"></i> 配置保存在服务器（page-config/settings），所有登录成员共享；该配置的读取接口公开，请勿存放密码、密钥等敏感信息。</p>
  </template>
</div>
</div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '@/api'

const loading = ref(true)
const saving = ref(false)
const migrated = ref(false)
const savedTip = ref(false)
const errorTip = ref('')
const brandName = ref('定制接单')
const depositRatio = ref(30)
const servicePhone = ref('400-888-8888')
let tipTimer = null

onMounted(async () => {
  try {
    const cfg = await api.get('/page-config/settings')
    const hasServer = cfg && typeof cfg === 'object' &&
      (cfg.brand_name !== undefined || cfg.deposit_ratio !== undefined || cfg.service_phone !== undefined)
    if (hasServer) {
      if (cfg.brand_name !== undefined && cfg.brand_name !== null) brandName.value = String(cfg.brand_name)
      if (cfg.deposit_ratio !== undefined && cfg.deposit_ratio !== null && !Number.isNaN(Number(cfg.deposit_ratio))) depositRatio.value = Number(cfg.deposit_ratio)
      if (cfg.service_phone !== undefined && cfg.service_phone !== null) servicePhone.value = String(cfg.service_phone)
    } else {
      // 服务器尚无配置：用本浏览器旧版 localStorage 值预填，保存即完成迁移
      const oldBrand = localStorage.getItem('cfg_brand')
      const oldRatio = localStorage.getItem('cfg_deposit_ratio')
      const oldPhone = localStorage.getItem('cfg_service_phone')
      if (oldBrand !== null || oldRatio !== null || oldPhone !== null) {
        if (oldBrand) brandName.value = oldBrand
        if (oldRatio !== null && oldRatio !== '' && !Number.isNaN(Number(oldRatio))) depositRatio.value = Number(oldRatio)
        if (oldPhone) servicePhone.value = oldPhone
        migrated.value = true
      }
    }
  } catch (e) {
    errorTip.value = '读取服务器配置失败，当前显示默认值'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => clearTimeout(tipTimer))

const save = async () => {
  let ratio = Number(depositRatio.value)
  if (Number.isNaN(ratio)) ratio = 30
  ratio = Math.min(100, Math.max(0, ratio))
  depositRatio.value = ratio
  saving.value = true
  savedTip.value = false
  errorTip.value = ''
  try {
    await api.put('/page-config/settings', { config: {
      brand_name: (brandName.value || '').trim() || '定制接单',
      deposit_ratio: ratio,
      service_phone: (servicePhone.value || '').trim(),
    } })
    migrated.value = false
    savedTip.value = true
    clearTimeout(tipTimer)
    tipTimer = setTimeout(() => { savedTip.value = false }, 3000)
  } catch (e) {
    errorTip.value = '保存失败，请稍后重试'
  } finally {
    saving.value = false
  }
}
</script>
<style scoped>
.loading-tip{padding:30px 0;text-align:center;color:var(--text3)}
.spin{display:inline-block;animation:spin 1s linear infinite}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.tip-bar{display:flex;align-items:flex-start;gap:6px;padding:10px 14px;border-radius:6px;font-size:13px;margin-bottom:16px;line-height:1.5}
.tip-warn{background:#FFF8E1;color:#B26A00;border:1px solid #FFE0B2}
.field-tip{margin-top:6px;font-size:12px;color:var(--text3)}
.save-row{display:flex;align-items:center;gap:12px}
.save-tip{display:inline-flex;align-items:center;gap:4px;font-size:13px}
.save-tip.ok{color:var(--success)}
.save-tip.err{color:var(--danger)}
.page-note{margin-top:16px;padding-top:14px;border-top:1px dashed var(--border);color:var(--text3);font-size:12px;line-height:1.6}
.page-note i{color:var(--warning);margin-right:2px}
</style>
