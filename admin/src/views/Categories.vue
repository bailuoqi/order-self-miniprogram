<template>
<div><div class="page-hd"><h2>服务分类</h2><button class="btn btn-primary" @click="showForm(null)"><i class="ri-add-line"></i> 新增分类</button></div>
<div class="card">
  <table class="table"><thead><tr><th>ID</th><th>名称</th><th>大类</th><th>排序</th><th>状态</th><th>操作</th></tr></thead>
    <tbody><tr v-for="c in list" :key="c.id"><td>{{c.id}}</td><td>{{c.name}}</td><td><span :class="'tag '+(c.group==='software'?'tag-blue':'tag-orange')">{{c.group==='software'?'软件定制':c.group==='electronics'?'电子代做':(c.group||'-')}}</span></td><td>{{c.sort}}</td><td><span :class="'tag '+(c.status===1?'tag-green':'tag-red')">{{c.status===1?'启用':'禁用'}}</span></td><td class="op-cell"><button class="btn btn-outline btn-sm" @click="showForm(c)"><i class="ri-edit-line"></i> 编辑</button><button class="btn btn-outline btn-sm op-danger" @click="delTarget=c"><i class="ri-delete-bin-line"></i> 删除</button></td></tr></tbody>
  </table>
  <p v-if="!list.length" class="empty"><i class="ri-inbox-line"></i>暂无分类<br/><button class="btn btn-primary" style="margin-top:14px" @click="showForm(null)"><i class="ri-add-line"></i> 新增分类</button></p>
</div>
<div class="modal-mask" v-if="editing" @click.self="editing=null"><div class="modal-box">
  <div class="modal-hd"><h3>{{form.id?'编辑':'新增'}}分类</h3><i class="ri-close-line" style="cursor:pointer;font-size:20px" @click="editing=null"></i></div>
  <div class="form-group"><label class="form-label">名称</label><input class="form-input" v-model="form.name" /></div>
  <div class="form-group"><label class="form-label">所属大类</label><select class="form-input" v-model="form.group"><option value="software">软件定制</option><option value="electronics">电子代做</option></select></div>
  <div class="form-row"><div class="form-group"><label class="form-label">排序</label><input class="form-input" type="number" v-model="form.sort" /></div><div class="form-group"><label class="form-label">状态</label><select class="form-input" v-model="form.status"><option :value="1">启用</option><option :value="0">禁用</option></select></div></div>
  <div class="modal-ft"><button class="btn btn-outline" @click="editing=null">取消</button><button class="btn btn-primary" :disabled="acting" @click="save">{{acting?'保存中...':'保存'}}</button></div>
</div></div>

<div class="modal-mask" v-if="delTarget" @click.self="delTarget=null"><div class="modal-box" style="min-width:360px">
  <div class="modal-hd"><h3>删除确认</h3><i class="ri-close-line" style="cursor:pointer;font-size:20px" @click="delTarget=null"></i></div>
  <p class="confirm-text">确定删除分类「{{delTarget.name}}」？删除后不可恢复。</p>
  <div class="modal-ft"><button class="btn btn-outline" @click="delTarget=null">取消</button><button class="btn btn-danger" :disabled="acting" @click="doDelete">{{acting?'删除中...':'确定删除'}}</button></div>
</div></div>

<transition name="toast-fade"><div v-if="toast" class="toast" :class="{'toast-err':toastErr}">{{toast}}</div></transition>
</div>
</template>
<script setup>
import { ref, onMounted } from "vue"
import api from "@/api"
const list=ref([])
const editing=ref(null)
const delTarget=ref(null)
const acting=ref(false)
const form=ref({name:"",group:"software",sort:0,status:1})

const toast=ref("");const toastErr=ref(false);let toastTimer=null
const showToast=(msg,err=false)=>{toast.value=msg;toastErr.value=err;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.value="",2500)}

const fetchList=async()=>{try{list.value=await api.get("/categories",{params:{all:1}})}catch(e){showToast(e.message||"加载失败",true)}}
onMounted(fetchList)
const showForm=(c)=>{form.value=c?{...c}:{name:"",group:"software",sort:0,status:1};editing.value=true}
const save=async()=>{
  if(!form.value.name?.trim())return showToast("请填写分类名称",true)
  acting.value=true
  try{
    if(form.value.id) await api.put("/categories/"+form.value.id,form.value)
    else await api.post("/categories",form.value)
    editing.value=null;await fetchList();showToast("已保存")
  }catch(e){showToast(e.message||"保存失败",true)}
  finally{acting.value=false}
}
const doDelete=async()=>{
  if(!delTarget.value)return
  acting.value=true
  try{await api.delete("/categories/"+delTarget.value.id);delTarget.value=null;await fetchList();showToast("已删除")}
  catch(e){showToast(e.message||"删除失败",true)}
  finally{acting.value=false}
}
</script>
<style scoped>
.op-cell{white-space:nowrap}
.op-cell .btn+.btn{margin-left:8px}
.op-danger:hover{border-color:var(--danger);color:var(--danger)}
.confirm-text{color:var(--text2);line-height:1.7}
.toast{position:fixed;top:24px;left:50%;transform:translateX(-50%);background:rgba(26,26,46,.9);color:#fff;padding:10px 22px;border-radius:8px;font-size:14px;z-index:2000;box-shadow:0 6px 20px rgba(0,0,0,.2)}
.toast-err{background:var(--danger)}
.toast-fade-enter-active,.toast-fade-leave-active{transition:all .25s}
.toast-fade-enter-from,.toast-fade-leave-to{opacity:0;transform:translate(-50%,-8px)}
</style>
