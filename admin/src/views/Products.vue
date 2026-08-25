<template>
<div><div class="page-hd"><h2>商品管理</h2><router-link to="/products/edit" class="btn btn-primary"><i class="ri-add-line"></i> 新增商品</router-link></div>
<div class="card">
  <div class="filter-bar">
    <div class="search-box"><i class="ri-search-line"></i><input class="form-input" v-model="kw" placeholder="按标题搜索" /></div>
    <select class="form-input filter-sel" v-model="catFilter"><option value="">全部分类</option><option v-for="c in categories" :key="c.id" :value="String(c.id)">{{c.name}}</option></select>
    <select class="form-input filter-sel" v-model="statusFilter"><option value="">全部状态</option><option value="1">上架</option><option value="0">下架</option></select>
    <span class="filter-count">共 {{filtered.length}} 条</span>
  </div>
  <table class="table"><thead><tr><th>ID</th><th>封面</th><th>标题</th><th>分类</th><th>价格</th><th>销量</th><th>状态</th><th>操作</th></tr></thead>
    <tbody><tr v-for="p in filtered" :key="p.id">
      <td>{{p.id}}</td>
      <td><img v-if="p.cover" :src="p.cover" class="cover-thumb" :alt="p.title" /><span v-else class="cover-thumb cover-empty"><i class="ri-image-line"></i></span></td>
      <td>{{p.title}}</td>
      <td>{{p.category?.name||'-'}}</td>
      <td>{{(p.price/100).toFixed(2)}}</td>
      <td>{{p.sold_count}}</td>
      <td><span :class="'tag '+(p.status===1?'tag-green':'tag-red')">{{p.status===1?'上架':'下架'}}</span></td>
      <td class="op-cell">
        <router-link :to="'/products/edit/'+p.id" class="btn btn-outline btn-sm"><i class="ri-edit-line"></i> 编辑</router-link>
        <button v-if="p.status===1" class="btn btn-outline btn-sm btn-off" @click="offTarget=p"><i class="ri-arrow-down-circle-line"></i> 下架</button>
        <button v-else class="btn btn-outline btn-sm btn-on" @click="putOn(p)"><i class="ri-arrow-up-circle-line"></i> 上架</button>
      </td>
    </tr></tbody>
  </table>
  <p v-if="!list.length" class="empty"><i class="ri-inbox-line"></i>暂无商品<br/><router-link to="/products/edit" class="btn btn-primary" style="margin-top:14px"><i class="ri-add-line"></i> 新增商品</router-link></p>
  <p v-else-if="!filtered.length" class="empty"><i class="ri-filter-off-line"></i>没有符合筛选条件的商品</p>
</div>

<div class="modal-mask" v-if="offTarget" @click.self="offTarget=null"><div class="modal-box" style="min-width:360px">
  <div class="modal-hd"><h3>下架确认</h3><i class="ri-close-line" style="cursor:pointer;font-size:20px" @click="offTarget=null"></i></div>
  <p class="confirm-text">确定下架「{{offTarget.title}}」？下架后客户端不再展示该服务，可随时重新上架。</p>
  <div class="modal-ft"><button class="btn btn-outline" @click="offTarget=null">取消</button><button class="btn btn-danger" :disabled="acting" @click="takeOff">{{acting?'处理中...':'确定下架'}}</button></div>
</div></div>

<transition name="toast-fade"><div v-if="toast" class="toast" :class="{'toast-err':toastErr}">{{toast}}</div></transition>
</div>
</template>
<script setup>
import { ref, computed, onMounted } from "vue"
import api from "@/api"
const list=ref([])
const categories=ref([])
const kw=ref("")
const catFilter=ref("")
const statusFilter=ref("")
const offTarget=ref(null)
const acting=ref(false)

const toast=ref("");const toastErr=ref(false);let toastTimer=null
const showToast=(msg,err=false)=>{toast.value=msg;toastErr.value=err;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.value="",2500)}

const fetchList=async()=>{try{const r=await api.get("/products",{params:{pageSize:200,all:"1"}});list.value=r.list}catch(e){showToast(e.message||"加载失败",true)}}
onMounted(async()=>{
  fetchList()
  try{categories.value=await api.get("/categories",{params:{all:1}})}catch(e){}
})

const filtered=computed(()=>{
  const k=kw.value.trim().toLowerCase()
  return list.value.filter(p=>
    (!k||(p.title||"").toLowerCase().includes(k))
    &&(!catFilter.value||String(p.category_id)===catFilter.value)
    &&(statusFilter.value===""||String(p.status)===statusFilter.value)
  )
})

const takeOff=async()=>{
  if(!offTarget.value)return
  acting.value=true
  try{await api.delete("/products/"+offTarget.value.id);offTarget.value=null;await fetchList();showToast("已下架")}
  catch(e){showToast(e.message||"下架失败",true)}
  finally{acting.value=false}
}
const putOn=async(p)=>{
  try{await api.put("/products/"+p.id,{status:1});await fetchList();showToast("已上架")}
  catch(e){showToast(e.message||"上架失败",true)}
}
</script>
<style scoped>
.filter-bar{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.search-box{position:relative;width:260px}
.search-box i{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text3)}
.search-box .form-input{padding-left:34px}
.filter-sel{width:150px}
.filter-count{margin-left:auto;color:var(--text3);font-size:13px}
.cover-thumb{width:44px;height:44px;border-radius:6px;object-fit:cover;display:block;border:1px solid var(--border)}
.cover-empty{display:flex;align-items:center;justify-content:center;background:#F5F6F8;color:var(--text3);font-size:20px}
.op-cell{white-space:nowrap}
.op-cell .btn+.btn{margin-left:8px}
.btn-off:hover{border-color:var(--danger);color:var(--danger)}
.btn-on:hover{border-color:var(--success);color:var(--success)}
.confirm-text{color:var(--text2);line-height:1.7}
.toast{position:fixed;top:24px;left:50%;transform:translateX(-50%);background:rgba(26,26,46,.9);color:#fff;padding:10px 22px;border-radius:8px;font-size:14px;z-index:2000;box-shadow:0 6px 20px rgba(0,0,0,.2)}
.toast-err{background:var(--danger)}
.toast-fade-enter-active,.toast-fade-leave-active{transition:all .25s}
.toast-fade-enter-from,.toast-fade-leave-to{opacity:0;transform:translate(-50%,-8px)}
@media (max-width:1366px){.search-box{width:200px}.filter-sel{width:130px}}
</style>
