<template>
<div><div class="page-hd"><h2>工作台</h2></div>
<div class="stat-cards">
  <div class="stat-card" style="cursor:pointer" @click="go('pending_quote')"><div class="stat-icon" style="background:#FFF3E0;color:#E65100"><i class="ri-money-cny-circle-line"></i></div><div><div class="stat-val">{{stats.pending_quote + stats.quoting}}</div><div class="stat-lbl">待报价/商议中</div></div></div>
  <div class="stat-card" style="cursor:pointer" @click="go('confirmed')"><div class="stat-icon" style="background:#E3F2FD;color:#1565C0"><i class="ri-wallet-3-line"></i></div><div><div class="stat-val">{{stats.awaiting_deposit}}</div><div class="stat-lbl">待收定金</div></div></div>
  <div class="stat-card" style="cursor:pointer" @click="go('deposit_paid')"><div class="stat-icon" style="background:#E8F5E9;color:#2E7D32"><i class="ri-tools-line"></i></div><div><div class="stat-val">{{stats.in_production}}</div><div class="stat-lbl">制作中</div></div></div>
  <div class="stat-card" style="cursor:pointer" @click="go('delivered')"><div class="stat-icon" style="background:#F3E5F5;color:#6A1B9A"><i class="ri-hand-coin-line"></i></div><div><div class="stat-val">{{stats.awaiting_final}}</div><div class="stat-lbl">待收尾款</div></div></div>
</div>
<div class="stat-cards" style="margin-top:0">
  <div class="stat-card"><div class="stat-icon" style="background:#E3F2FD;color:#1565C0"><i class="ri-file-add-line"></i></div><div><div class="stat-val">{{stats.new_today}}</div><div class="stat-lbl">今日新订单</div></div></div>
  <div class="stat-card"><div class="stat-icon" style="background:#E8F5E9;color:#2E7D32"><i class="ri-check-double-line"></i></div><div><div class="stat-val">{{stats.month_deal_count}}</div><div class="stat-lbl">本月成交单数</div></div></div>
  <div class="stat-card"><div class="stat-icon" style="background:#FFF3E0;color:#E65100"><i class="ri-money-cny-box-line"></i></div><div><div class="stat-val">{{(stats.month_deal_amount/100).toFixed(0)}}</div><div class="stat-lbl">本月成交额(元)</div></div></div>
  <div class="stat-card" style="cursor:pointer" @click="go('final_paid')"><div class="stat-icon" style="background:#F3E5F5;color:#6A1B9A"><i class="ri-star-smile-line"></i></div><div><div class="stat-val">{{stats.awaiting_review}}</div><div class="stat-lbl">待客户评价</div></div></div>
</div>
<div class="chart-row">
  <div class="card"><h3 style="margin-bottom:16px">最近订单</h3>
    <table class="table"><thead><tr><th>需求</th><th>报价(元)</th><th>状态</th></tr></thead>
      <tbody><tr v-for="o in recentOrders" :key="o.id" style="cursor:pointer" @click="$router.push('/orders/'+o.id)"><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{o.title}}</td><td>{{o.quote_amount?(o.quote_amount/100).toFixed(2):'-'}}</td><td><span :class="'tag '+statusTag(o.status)">{{statusLabel(o.status)}}</span></td></tr></tbody>
    </table>
  </div>
  <div class="card"><h3 style="margin-bottom:16px">待退款</h3>
    <table class="table"><thead><tr><th>订单</th><th>金额</th><th>原因</th></tr></thead>
      <tbody><tr v-for="r in pendingRefunds" :key="r.id"><td>{{r.order?.order_no?.slice(0,14)}}</td><td>{{(r.amount/100).toFixed(2)}}</td><td>{{r.reason?.slice(0,15)}}</td></tr></tbody>
    </table>
    <p v-if="!pendingRefunds.length" style="text-align:center;padding:30px;color:var(--text3)">暂无</p>
  </div>
</div></div>
</template>
<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import api from "@/api"
import { ORDER_STATUS_MAP, ORDER_STATUS_TAG } from "@/utils/order-status"
const router=useRouter()
const stats = ref({new_today:0,pending_quote:0,quoting:0,awaiting_deposit:0,in_production:0,awaiting_final:0,awaiting_review:0,month_deal_count:0,month_deal_amount:0})
const recentOrders = ref([])
const pendingRefunds = ref([])
const statusLabel=s=>ORDER_STATUS_MAP[s]||s
const statusTag=s=>ORDER_STATUS_TAG[s]||""
const go=(status)=>router.push({path:'/orders',query:{status}})
onMounted(async()=>{
  try{
    const [statsRes, ordersRes, refsRes] = await Promise.all([
      api.get("/orders/stats/dashboard"),
      api.get("/orders",{params:{pageSize:6}}),
      api.get("/refunds"),
    ])
    stats.value={...stats.value,...statsRes}
    recentOrders.value = (ordersRes.list||[]).slice(0,6)
    pendingRefunds.value = (refsRes||[]).filter(r=>r.status==="pending").slice(0,5)
  }catch(e){console.log(e)}
})
</script>
