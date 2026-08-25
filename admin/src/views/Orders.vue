<template>
<div><div class="page-hd"><h2>订单中心</h2><span class="total-hint" v-if="total">共 {{total}} 单</span></div>
<div class="filter-tabs">
  <button v-for="t in tabs" :key="t.key" @click="filterBy(t.key)" :class="'btn '+(activeTab===t.key?'btn-primary':'btn-outline')+' btn-sm'">{{t.label}}</button>
</div>
<div class="filter-bar">
  <div class="search-box">
    <i class="ri-search-line"></i>
    <input v-model="keyword" class="input search-input" placeholder="搜索单号 / 需求标题，回车检索" @keyup.enter="doSearch" />
    <i v-if="keyword" class="ri-close-circle-fill clear-ic" @click="clearKeyword"></i>
  </div>
  <button class="btn btn-primary btn-sm" @click="doSearch"><i class="ri-search-line"></i> 搜索</button>
  <select v-model="source" class="input source-sel" @change="doSearch">
    <option value="">全部来源</option>
    <option value="custom">自定义需求</option>
    <option value="product">标准服务</option>
  </select>
  <button v-if="hasFilter" class="btn btn-outline btn-sm" @click="resetFilter"><i class="ri-refresh-line"></i> 重置</button>
</div>
<div class="card">
  <table class="table"><thead><tr><th>单号</th><th>来源</th><th>客户</th><th>需求</th><th>报价(元)</th><th>状态</th><th>负责</th><th>时间</th><th>操作</th></tr></thead>
    <tbody><tr v-for="o in list" :key="o.id" style="cursor:pointer" @click="$router.push('/orders/'+o.id)">
      <td>{{o.order_no?.slice(0,14)}}</td>
      <td><span :class="'tag '+(ORDER_SOURCE_TAG[o.source]||'tag-blue')">{{ORDER_SOURCE_MAP[o.source]||o.source}}</span></td>
      <td>{{o.user?.nickname||'-'}}</td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{o.title}}</td>
      <td>{{o.quote_amount?(o.quote_amount/100).toFixed(2):'-'}}</td>
      <td><span :class="'tag '+tagClass(o.status)">{{label(o.status)}}</span></td>
      <td>{{o.assigned_admin_name||'-'}}</td>
      <td>{{o.created_at?.slice(0,10)}}</td>
      <td><button class="btn btn-outline btn-sm" @click.stop="$router.push('/orders/'+o.id)">处理</button></td>
    </tr></tbody>
  </table>
  <p v-if="!loading&&!list.length" class="empty"><i class="ri-inbox-line"></i>{{hasFilter?'没有符合筛选条件的订单':'暂无订单'}}<br/><button v-if="hasFilter" class="btn btn-outline btn-sm" style="margin-top:12px" @click="resetFilter">清除筛选条件</button></p>
  <p v-if="loading&&!list.length" class="empty" style="padding:40px 0"><i class="ri-loader-4-line"></i>加载中...</p>

  <!-- 分页（服务端 page/pageSize） -->
  <div class="pager" v-if="total>0">
    <span class="pager-info">共 {{total}} 条 · 第 {{page}}/{{totalPages}} 页</span>
    <div class="pager-btns">
      <button class="pg-btn" :disabled="page<=1" @click="goPage(page-1)"><i class="ri-arrow-left-s-line"></i></button>
      <button v-for="p in pageItems" :key="p.key" class="pg-btn" :class="{active:p.num===page,dots:!p.num}" :disabled="!p.num" @click="p.num&&goPage(p.num)">{{p.num||'…'}}</button>
      <button class="pg-btn" :disabled="page>=totalPages" @click="goPage(page+1)"><i class="ri-arrow-right-s-line"></i></button>
    </div>
  </div>
</div>
</div>
</template>
<script setup>
import { ref, computed, onMounted } from "vue"
import { useRoute } from "vue-router"
import api from "@/api"
import { ORDER_STATUS_MAP, ORDER_STATUS_TAG, ORDER_SOURCE_MAP, ORDER_SOURCE_TAG } from "@/utils/order-status"
const route = useRoute()
const list=ref([]);const activeTab=ref("")
const keyword=ref("");const source=ref("")
const page=ref(1);const pageSize=20;const total=ref(0)
const loading=ref(false)
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
const totalPages=computed(()=>Math.max(1,Math.ceil(total.value/pageSize)))
const hasFilter=computed(()=>!!(keyword.value.trim()||source.value||activeTab.value))
/** 页码序列：首尾恒显，当前页 ±2，间隔折叠为省略号 */
const pageItems=computed(()=>{
  const n=totalPages.value,cur=page.value,items=[]
  let last=0
  for(let i=1;i<=n;i++){
    if(i===1||i===n||Math.abs(i-cur)<=2){
      if(last&&i-last>1)items.push({key:'d'+i,num:0})
      items.push({key:i,num:i});last=i
    }
  }
  return items
})
const fetchList=async()=>{
  loading.value=true
  try{
    const params={page:page.value,pageSize}
    if(activeTab.value) params.status=activeTab.value
    if(source.value) params.source=source.value
    if(keyword.value.trim()) params.keyword=keyword.value.trim()
    const r=await api.get("/orders",{params})
    list.value=r.list||[]
    total.value=r.total||0
    // 删除/筛选后当前页超界时回退到最后一页重取
    if(!list.value.length&&page.value>1&&total.value>0){
      page.value=Math.max(1,Math.ceil(total.value/pageSize))
      await fetchList()
    }
  }catch(e){}
  loading.value=false
}
const filterBy=(k)=>{activeTab.value=k;page.value=1;fetchList()}
const doSearch=()=>{page.value=1;fetchList()}
const clearKeyword=()=>{keyword.value="";doSearch()}
const resetFilter=()=>{keyword.value="";source.value="";activeTab.value="";page.value=1;fetchList()}
const goPage=(p)=>{
  if(p<1||p>totalPages.value||p===page.value)return
  page.value=p;fetchList()
  window.scrollTo({top:0,behavior:"smooth"})
}
onMounted(()=>filterBy(route.query.status||""))
</script>
<style scoped>
.total-hint{font-size:13px;color:var(--text3)}
.filter-tabs{display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.filter-bar{display:flex;gap:10px;margin-bottom:16px;align-items:center;flex-wrap:wrap}
.search-box{position:relative;display:flex;align-items:center;width:320px;max-width:100%}
.search-box>.ri-search-line{position:absolute;left:10px;color:var(--text3);font-size:15px;pointer-events:none}
.search-input{width:100%;padding:8px 30px 8px 32px;border:1px solid var(--border);border-radius:6px;font-size:13px;outline:none;transition:border .2s;background:#fff}
.search-input:focus{border-color:var(--primary)}
.clear-ic{position:absolute;right:8px;color:var(--text3);cursor:pointer;font-size:15px}
.clear-ic:hover{color:var(--text2)}
.source-sel{padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;outline:none;background:#fff;color:var(--text2);cursor:pointer}
.source-sel:focus{border-color:var(--primary)}
.pager{display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:14px;border-top:1px solid var(--border);flex-wrap:wrap;gap:10px}
.pager-info{font-size:13px;color:var(--text3)}
.pager-btns{display:flex;gap:6px}
.pg-btn{min-width:32px;height:32px;padding:0 8px;border:1px solid var(--border);border-radius:6px;background:#fff;color:var(--text2);cursor:pointer;font-size:13px;display:inline-flex;align-items:center;justify-content:center;transition:all .15s}
.pg-btn:hover:not(:disabled):not(.active){border-color:var(--primary);color:var(--primary)}
.pg-btn.active{background:var(--primary);border-color:var(--primary);color:#fff;cursor:default}
.pg-btn.dots{border:none;background:transparent;cursor:default}
.pg-btn:disabled:not(.dots){opacity:.4;cursor:not-allowed}
</style>
