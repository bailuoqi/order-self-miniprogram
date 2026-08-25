<template>
<div><div class="page-hd"><h2>订单中心</h2></div>
<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
  <button v-for="t in tabs" :key="t.key" @click="filterBy(t.key)" :class="'btn '+(activeTab===t.key?'btn-primary':'btn-outline')+' btn-sm'">{{t.label}}</button>
</div>
<div class="card">
  <table class="table"><thead><tr><th>单号</th><th>来源</th><th>客户</th><th>需求</th><th>报价(元)</th><th>状态</th><th>负责</th><th>时间</th><th>操作</th></tr></thead>
    <tbody><tr v-for="o in list" :key="o.id" style="cursor:pointer" @click="$router.push('/orders/'+o.id)">
      <td>{{o.order_no?.slice(0,14)}}</td>
      <td><span :class="'tag '+(o.source==='custom'?'tag-orange':'tag-blue')">{{o.source==='custom'?'自定义':'标准服务'}}</span></td>
      <td>{{o.user?.nickname||'-'}}</td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{o.title}}</td>
      <td>{{o.quote_amount?(o.quote_amount/100).toFixed(2):'-'}}</td>
      <td><span :class="'tag '+tagClass(o.status)">{{label(o.status)}}</span></td>
      <td>{{o.assigned_admin_name||'-'}}</td>
      <td>{{o.created_at?.slice(0,10)}}</td>
      <td><button class="btn btn-outline btn-sm" @click.stop="$router.push('/orders/'+o.id)">处理</button></td>
    </tr></tbody>
  </table>
  <p v-if="!list.length" class="empty"><i class="ri-inbox-line"></i>暂无订单</p>
</div>
</div>
</template>
<script setup>
import { ref, onMounted } from "vue"
import { useRoute } from "vue-router"
import api from "@/api"
import { ORDER_STATUS_MAP, ORDER_STATUS_TAG } from "@/utils/order-status"
const route = useRoute()
const list=ref([]);const activeTab=ref("")
const tabs=[
  {key:"",label:"全部"},
  {key:"pending_quote",label:"待报价"},
  {key:"quoting",label:"报价商议中"},
  {key:"confirmed",label:"待收定金"},
  {key:"deposit_paid",label:"制作中"},
  {key:"delivered",label:"待收尾款"},
  {key:"final_paid",label:"待评价"},
  {key:"completed",label:"已完成"},
  {key:"cancelled",label:"已取消"},
  {key:"refunding",label:"退款中"},
]
const label=s=>ORDER_STATUS_MAP[s]||s;const tagClass=s=>ORDER_STATUS_TAG[s]||""
const filterBy=async(k)=>{
  activeTab.value=k
  try{
    const params={pageSize:50}
    if(k) params.status=k
    const r=await api.get("/orders",{params})
    list.value=r.list||[]
  }catch(e){}
}
onMounted(()=>filterBy(route.query.status||""))
</script>
