<template>
<div><div class="page-hd"><h2>客户管理</h2></div>
<div class="card">
  <table class="table"><thead><tr><th>ID</th><th>昵称</th><th>手机号</th><th>注册时间</th></tr></thead>
    <tbody><tr v-for="u in list" :key="u.id"><td>{{u.id}}</td><td>{{u.nickname}}</td><td>{{u.phone||'-'}}</td><td>{{u.created_at?.slice(0,10)}}</td></tr></tbody>
  </table>
  <p v-if="!list.length" class="empty"><i class="ri-inbox-line"></i>暂无客户</p>
</div>
</div>
</template>
<script setup>
import { ref, onMounted } from "vue"
import api from "@/api"
const list=ref([])
onMounted(async()=>{
  try{
    const r=await api.get("/users",{params:{pageSize:200}})
    list.value=r.list||[]
  }catch(e){}
})
</script>
