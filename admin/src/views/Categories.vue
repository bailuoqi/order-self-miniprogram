<template>
<div><div class="page-hd"><h2>服务分类</h2><button class="btn btn-primary" @click="showForm(null)"><i class="ri-add-line"></i> 新增分类</button></div>
<div class="card">
  <table class="table"><thead><tr><th>ID</th><th>名称</th><th>大类</th><th>排序</th><th>状态</th><th>操作</th></tr></thead>
    <tbody><tr v-for="c in list" :key="c.id"><td>{{c.id}}</td><td>{{c.name}}</td><td><span :class="'tag '+(c.group==='software'?'tag-blue':'tag-orange')">{{c.group==='software'?'软件定制':c.group==='electronics'?'电子代做':(c.group||'-')}}</span></td><td>{{c.sort}}</td><td><span :class="'tag '+(c.status===1?'tag-green':'tag-red')">{{c.status===1?'启用':'禁用'}}</span></td><td class="op-cell"><button class="btn btn-outline btn-sm" @click="showForm(c)"><i class="ri-edit-line"></i> 编辑</button><button class="btn btn-outline btn-sm op-danger" @click="doDelete(c)"><i class="ri-delete-bin-line"></i> 删除</button></td></tr></tbody>
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
</div>
</template>
<script setup>
import { ref, onMounted } from "vue"
import api from "@/api"
import { toast } from "@/components/ui/AppToast.vue"
import { appConfirm } from "@/components/ui/AppConfirm.vue"
const list=ref([])
const editing=ref(null)
const acting=ref(false)
const form=ref({name:"",group:"software",sort:0,status:1})

const fetchList=async()=>{try{list.value=await api.get("/categories",{params:{all:1}})}catch(e){toast(e.message||"加载失败","error")}}
onMounted(fetchList)
const showForm=(c)=>{form.value=c?{...c}:{name:"",group:"software",sort:0,status:1};editing.value=true}
const save=async()=>{
  if(!form.value.name?.trim())return toast("请填写分类名称","error")
  acting.value=true
  try{
    if(form.value.id) await api.put("/categories/"+form.value.id,form.value)
    else await api.post("/categories",form.value)
    editing.value=null;await fetchList();toast("已保存","success")
  }catch(e){toast(e.message||"保存失败","error")}
  finally{acting.value=false}
}
const doDelete=async(c)=>{
  const done=await appConfirm({
    title:"删除确认",
    message:`确定删除分类「${c.name}」？删除后不可恢复。`,
    confirmText:"确定删除",danger:true,loadingText:"删除中...",
    onConfirm:async()=>{await api.delete("/categories/"+c.id)},
  })
  if(!done)return
  await fetchList();toast("已删除","success")
}
</script>
<style scoped>
.op-cell{white-space:nowrap}
.op-cell .btn+.btn{margin-left:8px}
.op-danger:hover{border-color:var(--danger);color:var(--danger)}
</style>
