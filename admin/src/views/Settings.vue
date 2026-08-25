<template>
<div><div class="page-hd"><h2>系统配置</h2></div>
<div class="card" style="max-width:600px">
  <div class="form-group"><label class="form-label">团队/品牌名称</label><input class="form-input" v-model="brandName" /></div>
  <div class="form-group"><label class="form-label">默认定金比例 (%)</label><input class="form-input" type="number" min="0" max="100" v-model="depositRatio" /></div>
  <div class="form-group"><label class="form-label">客服电话</label><input class="form-input" v-model="servicePhone" /></div>
  <button class="btn btn-primary" @click="save">保存配置 (本地存储)</button>
  <p style="margin-top:12px;color:var(--text3);font-size:12px">* 当前版本配置保存在浏览器本地；默认定金比例用于报价时的预填参考</p>
</div>
</div>
</template>
<script setup>
import { ref } from 'vue'
const brandName=ref(localStorage.getItem('cfg_brand')||'定制接单')
const depositRatio=ref(localStorage.getItem('cfg_deposit_ratio')||'30')
const servicePhone=ref(localStorage.getItem('cfg_service_phone')||'400-888-8888')
const save=()=>{
  localStorage.setItem('cfg_brand',brandName.value)
  localStorage.setItem('cfg_deposit_ratio',depositRatio.value)
  localStorage.setItem('cfg_service_phone',servicePhone.value)
  alert('配置已保存')
}
</script>
