<template>
<div><div class="page-hd"><h2>CMS 内容管理</h2><router-link to="/cms/edit" class="btn btn-primary"><i class="ri-add-line"></i> 新增内容</router-link></div>
<div class="card">
  <div class="filter-bar">
    <div class="type-tabs">
      <button v-for="t in typeTabs" :key="t.value" class="type-tab" :class="{active:typeTab===t.value}" @click="typeTab=t.value">{{t.label}}<span v-if="t.value!=='all'" class="tab-count">{{countByType(t.value)}}</span></button>
    </div>
    <div class="search-box"><i class="ri-search-line"></i><input class="form-input" v-model="kw" placeholder="按标题搜索" /></div>
  </div>
  <p v-if="typeTab==='banner'" class="type-note"><i class="ri-information-line"></i> 轮播（banner）类型当前客户端未消费，仅作素材存档，二期接通首页展示。</p>
  <table class="table"><thead><tr><th>ID</th><th>标题</th><th>类型</th><th>浏览量</th><th>状态</th><th>操作</th></tr></thead>
    <tbody><tr v-for="a in filtered" :key="a.id">
      <td>{{a.id}}</td>
      <td>{{a.title}}</td>
      <td><span :class="'tag '+(TYPE_META[a.type]?.tag||'tag-blue')" :title="TYPE_META[a.type]?.note||''">{{TYPE_META[a.type]?.label||a.type}}</span></td>
      <td>{{a.views}}</td>
      <td><span :class="'tag '+(a.status?'tag-green':'tag-red')">{{a.status?'显示':'隐藏'}}</span></td>
      <td class="op-cell"><router-link :to="'/cms/edit/'+a.id" class="btn btn-outline btn-sm"><i class="ri-edit-line"></i> 编辑</router-link><button class="btn btn-outline btn-sm op-danger" @click="delTarget=a"><i class="ri-delete-bin-line"></i> 删除</button></td>
    </tr></tbody>
  </table>
  <p v-if="!list.length" class="empty"><i class="ri-inbox-line"></i>暂无内容<br/><router-link to="/cms/edit" class="btn btn-primary" style="margin-top:14px"><i class="ri-add-line"></i> 新增内容</router-link></p>
  <p v-else-if="!filtered.length" class="empty"><i class="ri-filter-off-line"></i>没有符合筛选条件的内容</p>
</div>

<div class="modal-mask" v-if="delTarget" @click.self="delTarget=null"><div class="modal-box" style="min-width:360px">
  <div class="modal-hd"><h3>删除确认</h3><i class="ri-close-line" style="cursor:pointer;font-size:20px" @click="delTarget=null"></i></div>
  <p class="confirm-text">确定删除「{{delTarget.title}}」？删除后不可恢复。</p>
  <div class="modal-ft"><button class="btn btn-outline" @click="delTarget=null">取消</button><button class="btn btn-danger" :disabled="acting" @click="doDelete">{{acting?'删除中...':'确定删除'}}</button></div>
</div></div>

<transition name="toast-fade"><div v-if="toast" class="toast" :class="{'toast-err':toastErr}">{{toast}}</div></transition>
</div>
</template>
<script setup>
import { ref, computed, onMounted } from "vue"
import api from "@/api"
const TYPE_META={
  notice:{label:"公告",tag:"tag-blue",note:"客户端首页公告条与公告列表"},
  help:{label:"帮助",tag:"tag-green",note:"客户端帮助/常见问题"},
  about:{label:"关于",tag:"tag-orange",note:"客户端关于页"},
  banner:{label:"轮播",tag:"tag-red",note:"客户端暂未消费该类型"},
}
const typeTabs=[{value:"all",label:"全部"},{value:"notice",label:"公告"},{value:"help",label:"帮助"},{value:"about",label:"关于"},{value:"banner",label:"轮播"}]
const list=ref([])
const typeTab=ref("all")
const kw=ref("")
const delTarget=ref(null)
const acting=ref(false)

const toast=ref("");const toastErr=ref(false);let toastTimer=null
const showToast=(msg,err=false)=>{toast.value=msg;toastErr.value=err;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.value="",2500)}

const fetchList=async()=>{
  try{
    const r=await api.get("/cms/articles/all",{params:{pageSize:200}})
    list.value=r.list||[]
  }catch(e){showToast(e.message||"加载失败",true)}
}
onMounted(fetchList)

const countByType=(t)=>list.value.filter(a=>a.type===t).length
const filtered=computed(()=>{
  const k=kw.value.trim().toLowerCase()
  return list.value.filter(a=>
    (typeTab.value==="all"||a.type===typeTab.value)
    &&(!k||(a.title||"").toLowerCase().includes(k))
  )
})

const doDelete=async()=>{
  if(!delTarget.value)return
  acting.value=true
  try{await api.delete("/cms/articles/"+delTarget.value.id);delTarget.value=null;await fetchList();showToast("已删除")}
  catch(e){showToast(e.message||"删除失败",true)}
  finally{acting.value=false}
}
</script>
<style scoped>
.filter-bar{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.type-tabs{display:flex;gap:8px}
.type-tab{padding:7px 16px;border:1px solid var(--border);border-radius:6px;background:#fff;color:var(--text2);cursor:pointer;font-size:13px;display:inline-flex;align-items:center;gap:6px;transition:all .2s}
.type-tab:hover{border-color:var(--primary);color:var(--primary)}
.type-tab.active{background:var(--primary);border-color:var(--primary);color:#fff}
.tab-count{font-size:12px;opacity:.75}
.search-box{position:relative;width:240px;margin-left:auto}
.search-box i{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text3)}
.search-box .form-input{padding-left:34px}
.type-note{display:flex;align-items:center;gap:6px;background:#FFF7E6;color:#B26A00;border:1px solid #FFE1B3;border-radius:6px;padding:8px 12px;font-size:13px;margin-bottom:12px}
.op-cell{white-space:nowrap}
.op-cell .btn+.btn{margin-left:8px}
.op-danger:hover{border-color:var(--danger);color:var(--danger)}
.confirm-text{color:var(--text2);line-height:1.7}
.toast{position:fixed;top:24px;left:50%;transform:translateX(-50%);background:rgba(26,26,46,.9);color:#fff;padding:10px 22px;border-radius:8px;font-size:14px;z-index:2000;box-shadow:0 6px 20px rgba(0,0,0,.2)}
.toast-err{background:var(--danger)}
.toast-fade-enter-active,.toast-fade-leave-active{transition:all .25s}
.toast-fade-enter-from,.toast-fade-leave-to{opacity:0;transform:translate(-50%,-8px)}
@media (max-width:1366px){.search-box{width:190px}}
</style>
