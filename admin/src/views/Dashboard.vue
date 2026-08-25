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
<div class="card trend-card">
  <div class="card-hd">
    <h3>近 30 天新订单数 / 成交额</h3>
    <span class="trend-note">基于最近 200 单统计</span>
  </div>
  <v-chart v-if="trendReady" class="trend-chart" :option="trendOption" autoresize />
  <div v-else class="trend-holder">{{ loadFailed ? '数据加载失败' : '加载中…' }}</div>
</div>
<div class="chart-row">
  <div class="card"><div class="card-hd"><h3>最近订单</h3><router-link class="view-all" to="/orders">查看全部 <i class="ri-arrow-right-line"></i></router-link></div>
    <table class="table"><thead><tr><th>需求</th><th>客户</th><th>报价(元)</th><th>状态</th></tr></thead>
      <tbody><tr v-for="o in recentOrders" :key="o.id" style="cursor:pointer" @click="$router.push('/orders/'+o.id)"><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{o.title}}</td><td>{{o.user?.nickname || o.contact || '-'}}</td><td>{{o.quote_amount?(o.quote_amount/100).toFixed(2):'-'}}</td><td><span :class="'tag '+statusTag(o.status)">{{statusLabel(o.status)}}</span></td></tr></tbody>
    </table>
    <p v-if="!recentOrders.length" style="text-align:center;padding:30px;color:var(--text3)">暂无</p>
  </div>
  <div class="card"><div class="card-hd"><h3>待退款</h3></div>
    <table class="table"><thead><tr><th>订单</th><th>金额</th><th>原因</th></tr></thead>
      <tbody><tr v-for="r in pendingRefunds" :key="r.id" style="cursor:pointer" title="点击前往退款处理" @click="$router.push('/refunds')"><td>{{r.order?.order_no?.slice(0,14)}}</td><td>{{(r.amount/100).toFixed(2)}}</td><td>{{r.reason?.slice(0,15)}}</td></tr></tbody>
    </table>
    <p v-if="!pendingRefunds.length" style="text-align:center;padding:30px;color:var(--text3)">暂无</p>
  </div>
</div></div>
</template>
<script setup>
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { LineChart } from "echarts/charts"
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components"
import VChart from "vue-echarts"
import api from "@/api"
import { ORDER_STATUS_MAP, ORDER_STATUS_TAG } from "@/utils/order-status"
use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])
const router=useRouter()
const stats = ref({new_today:0,pending_quote:0,quoting:0,awaiting_deposit:0,in_production:0,awaiting_final:0,awaiting_review:0,month_deal_count:0,month_deal_amount:0})
const recentOrders = ref([])
const pendingRefunds = ref([])
const trendReady = ref(false)
const loadFailed = ref(false)
const trendDates = ref([])
const trendCounts = ref([])
const trendAmounts = ref([])
const statusLabel=s=>ORDER_STATUS_MAP[s]||s
const statusTag=s=>ORDER_STATUS_TAG[s]||""
const go=(status)=>router.push({path:'/orders',query:{status}})

const dayKey=d=>`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
/** 近 30 天按天聚合：新订单数按 created_at，成交额按 quote_confirmed_at（口径同仪表盘"本月成交额"） */
const buildTrend=(orders)=>{
  const today=new Date(); today.setHours(0,0,0,0)
  const days=[]
  for(let i=29;i>=0;i--) days.push(new Date(today.getTime()-i*86400000))
  const countMap={}, amountMap={}
  days.forEach(d=>{ countMap[dayKey(d)]=0; amountMap[dayKey(d)]=0 })
  orders.forEach(o=>{
    if(o.created_at){
      const k=dayKey(new Date(o.created_at))
      if(k in countMap) countMap[k]++
    }
    if(o.quote_confirmed_at && o.quote_amount){
      const k=dayKey(new Date(o.quote_confirmed_at))
      if(k in amountMap) amountMap[k]+=o.quote_amount
    }
  })
  trendDates.value=days.map(d=>`${d.getMonth()+1}/${d.getDate()}`)
  trendCounts.value=days.map(d=>countMap[dayKey(d)])
  trendAmounts.value=days.map(d=>+(amountMap[dayKey(d)]/100).toFixed(2))
}

const trendOption=computed(()=>({
  tooltip:{trigger:'axis'},
  legend:{data:['新订单数','成交额(元)'],top:0,right:0},
  grid:{left:8,right:8,top:40,bottom:0,containLabel:true},
  xAxis:{type:'category',boundaryGap:false,data:trendDates.value,axisLine:{lineStyle:{color:'#E8E8E8'}},axisLabel:{color:'#999'}},
  yAxis:[
    {type:'value',name:'新订单数',minInterval:1,axisLabel:{color:'#999'},splitLine:{lineStyle:{color:'#F0F2F5'}}},
    {type:'value',name:'成交额(元)',axisLabel:{color:'#999'},splitLine:{show:false}},
  ],
  series:[
    {name:'新订单数',type:'line',smooth:true,showSymbol:false,data:trendCounts.value,itemStyle:{color:'#2979FF'},lineStyle:{width:2},areaStyle:{opacity:.08}},
    {name:'成交额(元)',type:'line',smooth:true,showSymbol:false,yAxisIndex:1,data:trendAmounts.value,itemStyle:{color:'#00C853'},lineStyle:{width:2}},
  ],
}))

onMounted(async()=>{
  try{
    const [statsRes, ordersRes, refsRes] = await Promise.all([
      api.get("/orders/stats/dashboard"),
      api.get("/orders",{params:{pageSize:200}}),
      api.get("/refunds"),
    ])
    stats.value={...stats.value,...statsRes}
    const list = ordersRes.list||[]
    recentOrders.value = list.slice(0,6)
    pendingRefunds.value = (refsRes||[]).filter(r=>r.status==="pending").slice(0,5)
    buildTrend(list)
    trendReady.value=true
  }catch(e){ loadFailed.value=true; console.log(e) }
})
</script>
<style scoped>
.card-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.card-hd h3{font-size:16px}
.view-all{font-size:13px;display:inline-flex;align-items:center;gap:2px}
.trend-card{margin-bottom:24px}
.trend-note{font-size:12px;color:var(--text3)}
.trend-chart{height:300px;width:100%}
.trend-holder{height:300px;display:flex;align-items:center;justify-content:center;color:var(--text3)}
@media (max-width:1440px){
  .stat-cards{grid-template-columns:repeat(2,1fr)}
  .trend-chart,.trend-holder{height:260px}
}
</style>
