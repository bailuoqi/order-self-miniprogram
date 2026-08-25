<template>
<div class="pp-mask" @click.self="$emit('cancel')">
  <div class="pp-box">
    <div class="pp-head">
      <span><i class="ri-shopping-bag-3-line"></i> 选择服务</span>
      <button type="button" class="pp-close" title="关闭" @click="$emit('cancel')"><i class="ri-close-line"></i></button>
    </div>
    <div class="pp-search">
      <i class="ri-search-line"></i>
      <input v-model="keyword" placeholder="搜索服务标题，回车检索" @keyup.enter="load" />
      <button type="button" @click="load">搜索</button>
    </div>
    <div class="pp-list">
      <div v-if="loading" class="pp-tip"><i class="ri-loader-4-line pp-spin"></i> 加载中…</div>
      <div v-else-if="loadError" class="pp-tip">服务列表加载失败 <button type="button" class="pp-retry" @click="load">重试</button></div>
      <div v-else-if="!list.length" class="pp-tip">暂无匹配的上架服务</div>
      <label v-else v-for="prod in list" :key="prod.id" class="pp-item">
        <input type="checkbox" :checked="checked.has(prod.id)" @change="toggle(prod)" />
        <span class="pp-cover">
          <img v-if="prod.cover" :src="prod.cover" />
          <i v-else class="ri-image-line"></i>
        </span>
        <span class="pp-title">{{ prod.title }}</span>
        <span class="pp-price">¥{{ prod.price }}</span>
      </label>
    </div>
    <div class="pp-foot">
      <span class="pp-count">已选 {{ checked.size }} 项</span>
      <button type="button" class="pp-btn-outline" @click="$emit('cancel')">取消</button>
      <button type="button" class="pp-btn" @click="confirm">确定</button>
    </div>
  </div>
</div>
</template>

<script setup>
// 商品行「选择服务」弹窗：GET /products 勾选，确定后返回 {id,title,price,cover} 快照数组
import { ref, onMounted } from 'vue'
import api from '@/api'

const props = defineProps({
  selected: { type: Array, default: () => [] },
})
const emit = defineEmits(['confirm', 'cancel'])

const list = ref([])
const loading = ref(false)
const loadError = ref(false)
const keyword = ref('')
const checked = ref(new Map(
  (props.selected || []).filter(g => g && g.id != null)
    .map(g => [g.id, { id: g.id, title: g.title, price: g.price, cover: g.cover || '' }])
))

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const params = { page: 1, pageSize: 100 }
    if (keyword.value.trim()) params.keyword = keyword.value.trim()
    const res = await api.get('/products', { params })
    list.value = (res && res.list) || []
  } catch (e) {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

function toggle(prod) {
  if (checked.value.has(prod.id)) checked.value.delete(prod.id)
  else checked.value.set(prod.id, { id: prod.id, title: prod.title, price: prod.price, cover: prod.cover || '' })
}

function confirm() {
  emit('confirm', Array.from(checked.value.values()))
}

onMounted(load)
</script>

<style scoped>
.pp-mask{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:1000}
.pp-box{background:#fff;border-radius:12px;width:520px;max-width:92vw;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.15)}
.pp-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 12px;font-size:15px;font-weight:600;color:#333}
.pp-head span{display:flex;align-items:center;gap:8px}
.pp-close{background:none;border:none;cursor:pointer;font-size:18px;color:#999;padding:2px}
.pp-close:hover{color:#333}
.pp-search{display:flex;align-items:center;gap:8px;margin:0 20px 10px;padding:0 10px;border:1px solid #d9d9d9;border-radius:8px}
.pp-search i{color:#999}
.pp-search input{flex:1;border:none;outline:none;padding:8px 0;font-size:13px}
.pp-search button{border:none;background:none;color:#2979FF;cursor:pointer;font-size:13px;padding:6px 4px}
.pp-list{flex:1;overflow-y:auto;padding:0 20px;min-height:180px}
.pp-tip{padding:40px 0;text-align:center;color:#999;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px}
.pp-retry{border:1px solid #d9d9d9;background:#fff;border-radius:4px;padding:2px 10px;cursor:pointer;color:#2979FF;font-size:12px}
.pp-item{display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid #f5f5f5;cursor:pointer;font-size:13px}
.pp-item:hover{background:#f9fbff}
.pp-cover{width:44px;height:44px;border-radius:6px;overflow:hidden;background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:18px;flex-shrink:0}
.pp-cover img{width:100%;height:100%;object-fit:cover;display:block}
.pp-title{flex:1;color:#333;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.pp-price{color:#ff4d4f;font-weight:600;flex-shrink:0}
.pp-foot{display:flex;align-items:center;gap:10px;padding:12px 20px 16px;border-top:1px solid #f0f0f0}
.pp-count{flex:1;font-size:12px;color:#999}
.pp-btn{padding:7px 18px;border-radius:6px;font-size:13px;cursor:pointer;border:none;background:#2979FF;color:#fff}
.pp-btn:hover{background:#1c6ae0}
.pp-btn-outline{padding:7px 18px;border-radius:6px;font-size:13px;cursor:pointer;border:1px solid #d9d9d9;background:#fff;color:#555}
.pp-btn-outline:hover{border-color:#2979FF;color:#2979FF}
.pp-spin{animation:pp-spin .8s linear infinite}
@keyframes pp-spin{to{transform:rotate(360deg)}}
</style>
