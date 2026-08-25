<template>
<div><div class="page-hd"><h2>纳新申请</h2></div>
<div style="display:flex;gap:10px;margin-bottom:16px">
  <button v-for="t in tabs" :key="t.key" @click="filterBy(t.key)" :class="'btn '+(activeTab===t.key?'btn-primary':'btn-outline')+' btn-sm'">{{t.label}}</button>
</div>
<div class="card">
  <table class="table"><thead><tr><th>ID</th><th>姓名</th><th>联系方式</th><th>方向</th><th>简介</th><th>作品</th><th>状态</th><th>提交时间</th><th>操作</th></tr></thead>
    <tbody><tr v-for="a in list" :key="a.id">
      <td>{{a.id}}</td>
      <td>{{a.name}}</td>
      <td>{{a.contact}}</td>
      <td><span class="tag tag-blue">{{dirLabel(a.direction)}}</span></td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" :title="a.intro">{{a.intro||'-'}}</td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" :title="a.works">{{a.works||'-'}}</td>
      <td><span :class="'tag '+(a.status==='approved'?'tag-green':a.status==='pending'?'tag-orange':'tag-red')">{{statusLabel(a.status)}}</span></td>
      <td>{{a.created_at?.slice(0,16)}}</td>
      <td>
        <template v-if="a.status==='pending'">
          <button class="btn btn-success btn-sm" @click="audit(a,true)">通过</button>
          <button class="btn btn-danger btn-sm" style="margin-left:4px" @click="audit(a,false)">拒绝</button>
        </template>
        <span v-else style="color:var(--text3);font-size:12px">{{a.admin_remark||'-'}}</span>
      </td>
    </tr></tbody>
  </table>
  <p v-if="!list.length" class="empty"><i class="ri-inbox-line"></i>暂无申请</p>
</div>
<p style="margin-top:12px;color:var(--text3);font-size:13px">提示：申请通过后，请在「团队成员」中为其创建后台账号。</p>
</div>
</template>
<script setup>
import { ref, onMounted } from "vue"
import api from "@/api"
const list=ref([]);const activeTab=ref("pending")
const tabs=[{key:"pending",label:"待审核"},{key:"approved",label:"已通过"},{key:"rejected",label:"已拒绝"},{key:"",label:"全部"}]
const sl={pending:"待审核",approved:"已通过",rejected:"已拒绝"}
const statusLabel=s=>sl[s]||s
const dirLabel=d=>({software:"软件",electronics:"电子",both:"软件+电子"}[d]||d)
const filterBy=async(k)=>{
  activeTab.value=k
  try{
    const params={}
    if(k)params.status=k
    const r=await api.get("/recruit",{params})
    list.value=r.list||r||[]
  }catch(e){}
}
onMounted(()=>filterBy("pending"))
const audit=async(a,approved)=>{
  const remark=prompt(approved?"通过备注(可选):":"拒绝原因:")
  if(remark===null)return
  try{
    await api.put("/recruit/"+a.id+"/audit",{approved,remark})
    await filterBy(activeTab.value)
  }catch(err){alert(err.message||"操作失败")}
}
</script>
