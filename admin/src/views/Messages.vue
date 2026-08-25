<template>
<div><div class="page-hd"><h2>消息中心</h2></div>
<div class="card">
  <table class="table"><thead><tr><th>订单</th><th>客户</th><th>最新消息</th><th>时间</th><th>未读</th><th>操作</th></tr></thead>
    <tbody><tr v-for="s in sessions" :key="s.id">
      <td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{s.order?.title||('订单 #'+s.order_id)}}</td>
      <td>{{s.order?.user?.nickname||'-'}}</td>
      <td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{s.last_message||'-'}}</td>
      <td>{{s.last_message_at?.slice(0,16)||'-'}}</td>
      <td><span v-if="s.team_unread" class="tag tag-red">{{s.team_unread}}</span><span v-else style="color:var(--text3)">0</span></td>
      <td><button class="btn btn-primary btn-sm" @click="$router.push('/orders/'+s.order_id)">去处理</button></td>
    </tr></tbody>
  </table>
  <p v-if="!sessions.length" class="empty"><i class="ri-inbox-line"></i>暂无会话</p>
</div>
</div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
const sessions=ref([])
onMounted(async()=>{try{sessions.value=await api.get('/chat/admin/sessions')}catch(e){}})
</script>
