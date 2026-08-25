<template>
<div><div class="page-hd"><h2>订单处理</h2><button class="btn btn-outline btn-sm" @click="$router.push('/orders')"><i class="ri-arrow-left-line"></i> 返回</button></div>
<div v-if="order" style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
  <!-- 左列：订单信息与操作 -->
  <div style="flex:1;min-width:480px">
    <!-- 基本信息 -->
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3>{{order.title}}</h3>
        <span :class="'tag '+tagClass(order.status)">{{label(order.status)}}</span>
      </div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">订单编号</span><span class="info-val">{{order.order_no}}</span></div>
        <div class="info-item"><span class="info-label">来源</span><span class="info-val">{{order.source==='custom'?'自定义需求':'标准服务下单'}}</span></div>
        <div class="info-item"><span class="info-label">客户</span><span class="info-val">{{order.user?.nickname||'-'}} ({{order.user?.phone||'无手机号'}})</span></div>
        <div class="info-item"><span class="info-label">联系方式</span><span class="info-val">{{order.contact||'-'}}</span></div>
        <div class="info-item" v-if="order.product"><span class="info-label">关联服务</span><span class="info-val">{{order.product.title}}</span></div>
        <div class="info-item" v-if="order.category"><span class="info-label">品类</span><span class="info-val">{{order.category.name}}</span></div>
        <div class="info-item"><span class="info-label">期望工期</span><span class="info-val">{{order.expected_days||'-'}}</span></div>
        <div class="info-item"><span class="info-label">创建时间</span><span class="info-val">{{order.created_at?.slice(0,19)}}</span></div>
        <div class="info-item" style="grid-column:span 2"><span class="info-label">需求描述</span><span class="info-val" style="white-space:pre-line">{{order.requirement||'-'}}</span></div>
        <div class="info-item" v-if="order.attachments?.length" style="grid-column:span 2">
          <span class="info-label">客户附件</span>
          <span class="info-val"><a v-for="(f,i) in order.attachments" :key="i" :href="fileUrl(f)" target="_blank" style="margin-right:12px">附件{{i+1}}</a></span>
        </div>
      </div>
    </div>

    <!-- 报价 -->
    <div class="card" style="margin-bottom:16px">
      <h3 style="margin-bottom:12px">报价{{order.quote_amount?'（可修改，确认前有效）':''}}</h3>
      <div v-if="canQuote" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <label class="fld">总价（元）<input v-model="quoteForm.amount" type="number" min="0" step="0.01" class="input" placeholder="如 3000" /></label>
        <label class="fld">定金（元）<input v-model="quoteForm.deposit" type="number" min="0" step="0.01" class="input" placeholder="如 900（默认30%）" /></label>
        <label class="fld">预计工期<input v-model="quoteForm.days" class="input" placeholder="如 15天" /></label>
        <label class="fld" style="grid-column:span 2">交付说明（合约要点）<textarea v-model="quoteForm.note" class="input" rows="3" placeholder="交付物、验收标准、修改次数等"></textarea></label>
      </div>
      <div v-if="canQuote" style="display:flex;gap:10px;align-items:center">
        <button class="btn btn-primary" @click="submitQuote">{{order.quote_amount?'更新报价':'提交报价'}}</button>
        <span style="color:var(--text3);font-size:12px">尾款 = 总价 - 定金，自动计算</span>
      </div>
      <div v-if="order.quote_amount" style="margin-top:12px;padding:12px;background:var(--bg2,#f7f8fa);border-radius:8px;display:flex;gap:24px;flex-wrap:wrap">
        <span>总价 <b style="color:#E65100">¥{{fmt(order.quote_amount)}}</b></span>
        <span>定金 <b>¥{{fmt(order.deposit_amount)}}</b>{{order.deposit_paid_at?' ✓已付':''}}</span>
        <span>尾款 <b>¥{{fmt(order.final_amount)}}</b>{{order.final_paid_at?' ✓已付':''}}</span>
        <span>工期 <b>{{order.quote_days||'-'}}</b></span>
      </div>
      <div v-if="order.quotes?.length" style="margin-top:10px">
        <div style="font-size:12px;color:var(--text3);margin-bottom:4px">报价历史</div>
        <div v-for="q in order.quotes" :key="q.id" style="font-size:13px;color:var(--text2);padding:4px 0;border-bottom:1px dashed var(--border)">
          ¥{{fmt(q.amount)}}（定金 ¥{{fmt(q.deposit_amount)}}，{{q.days||'-'}}） · {{q.created_by}} · {{q.created_at?.slice(0,16)}}
          <span v-if="q.is_confirmed" class="tag tag-green" style="margin-left:6px">客户已确认</span>
        </div>
      </div>
    </div>

    <!-- 交付 -->
    <div class="card" style="margin-bottom:16px" v-if="order.status==='deposit_paid'||order.delivered_at">
      <h3 style="margin-bottom:12px">交付成果</h3>
      <template v-if="order.status==='deposit_paid'">
        <label class="fld" style="margin-bottom:10px">交付说明<textarea v-model="deliverForm.note" class="input" rows="3" placeholder="交付内容说明、使用方式、验收要点"></textarea></label>
        <div style="margin-bottom:10px">
          <div style="font-size:12px;color:var(--text3);margin-bottom:6px">交付文件（图片/pdf/zip）</div>
          <div v-for="(f,i) in deliverForm.files" :key="i" style="display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:13px">
            <a :href="fileUrl(f)" target="_blank">{{f}}</a>
            <button class="btn btn-outline btn-sm" @click="deliverForm.files.splice(i,1)">删除</button>
          </div>
          <input type="file" ref="fileInput" style="display:none" @change="onFileChosen" />
          <button class="btn btn-outline btn-sm" @click="$refs.fileInput.click()"><i class="ri-upload-2-line"></i> 上传文件</button>
        </div>
        <label class="fld" style="margin-bottom:12px">快递单号（电子类实物，选填）<input v-model="deliverForm.tracking" class="input" placeholder="如 SF1234567890" /></label>
        <button class="btn btn-primary" @click="submitDeliver">确认交付，通知客户付尾款</button>
      </template>
      <template v-else>
        <div class="info-grid">
          <div class="info-item" style="grid-column:span 2"><span class="info-label">交付说明</span><span class="info-val" style="white-space:pre-line">{{order.delivery_note||'-'}}</span></div>
          <div class="info-item" v-if="order.delivery_files?.length" style="grid-column:span 2">
            <span class="info-label">交付文件</span>
            <span class="info-val"><a v-for="(f,i) in order.delivery_files" :key="i" :href="fileUrl(f)" target="_blank" style="margin-right:12px">文件{{i+1}}</a></span>
          </div>
          <div class="info-item"><span class="info-label">快递单号</span><span class="info-val">{{order.delivery_tracking_no||'-'}}</span></div>
          <div class="info-item"><span class="info-label">交付时间</span><span class="info-val">{{order.delivered_at?.slice(0,19)}}</span></div>
        </div>
      </template>
    </div>

    <!-- 客户评价 -->
    <div class="card" style="margin-bottom:16px" v-if="order.review_score">
      <h3 style="margin-bottom:12px">客户评价</h3>
      <div style="color:#FF9100;font-size:18px">{{'★'.repeat(order.review_score)}}{{'☆'.repeat(5-order.review_score)}}</div>
      <p style="margin-top:8px;color:var(--text2)">{{order.review_content||'（未填写文字评价）'}}</p>
      <p style="margin-top:4px;font-size:12px;color:var(--text3)">{{order.review_anonymous?'匿名评价':'实名评价'}} · {{order.reviewed_at?.slice(0,16)}}</p>
    </div>

    <!-- 其他操作 -->
    <div class="card" style="margin-bottom:16px">
      <h3 style="margin-bottom:12px">其他操作</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <select v-model="assignId" class="input" style="width:auto">
          <option :value="0">选择负责成员</option>
          <option v-for="a in admins" :key="a.id" :value="a.id">{{a.display_name||a.username}}</option>
        </select>
        <button class="btn btn-outline" @click="doAssign">分配</button>
        <button v-if="['confirmed','delivered'].includes(order.status)" class="btn btn-warning" @click="doRemind">催付{{order.status==='confirmed'?'定金':'尾款'}}</button>
        <button v-if="canCancel" class="btn btn-danger" @click="doCancel">取消订单</button>
      </div>
      <p v-if="order.assigned_admin_name" style="margin-top:8px;font-size:13px;color:var(--text2)">当前负责：{{order.assigned_admin_name}}</p>
    </div>

    <!-- 日志 -->
    <div class="card" v-if="order.logs?.length">
      <h3 style="margin-bottom:12px">操作日志</h3>
      <div class="log-list">
        <div v-for="l in sortedLogs" :key="l.id" class="log-item"><span class="log-time">{{l.created_at?.slice(0,19)}}</span><span>{{l.description||l.content}}</span></div>
      </div>
    </div>
  </div>

  <!-- 右列：与客户沟通 -->
  <div class="card" style="width:360px;flex-shrink:0;display:flex;flex-direction:column;height:600px">
    <h3 style="margin-bottom:12px">与客户沟通</h3>
    <div ref="msgBox" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:4px">
      <div v-for="m in messages" :key="m.id" :style="{alignSelf:m.from_team?'flex-end':'flex-start',maxWidth:'80%'}">
        <div style="font-size:11px;color:var(--text3);margin-bottom:2px" :style="{textAlign:m.from_team?'right':'left'}">{{m.from_team?(m.sender_name||'团队'):'客户'}} · {{m.created_at?.slice(11,16)}}</div>
        <div :style="{background:m.from_team?'#E3F2FD':'#f5f5f5',padding:'8px 12px',borderRadius:'8px',fontSize:'13px',wordBreak:'break-all'}">{{m.content}}</div>
      </div>
      <p v-if="!messages.length" style="text-align:center;color:var(--text3);padding:30px 0;font-size:13px">暂无消息，可主动与客户沟通报价</p>
    </div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <input v-model="chatInput" class="input" style="flex:1" placeholder="输入消息..." @keyup.enter="sendChat" />
      <button class="btn btn-primary" @click="sendChat">发送</button>
    </div>
  </div>
</div>
<div v-else class="card"><p style="text-align:center;padding:40px;color:var(--text3)">加载中...</p></div>
</div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue"
import { useRoute } from "vue-router"
import api from "@/api"
import { ORDER_STATUS_MAP, ORDER_STATUS_TAG, fmtFen } from "@/utils/order-status"

const route=useRoute()
const order=ref(null)
const admins=ref([])
const assignId=ref(0)
const quoteForm=ref({amount:'',deposit:'',days:'',note:''})
const deliverForm=ref({note:'',files:[],tracking:''})
const fileInput=ref(null)

const sessionId=ref(0)
const messages=ref([])
const chatInput=ref('')
const msgBox=ref(null)
let chatTimer=null

const label=s=>ORDER_STATUS_MAP[s]||s
const tagClass=s=>ORDER_STATUS_TAG[s]||""
const fmt=fmtFen
const fileUrl=f=>f?.startsWith('http')?f:f

const canQuote=computed(()=>['pending_quote','quoting'].includes(order.value?.status))
const canCancel=computed(()=>['pending_quote','quoting','confirmed'].includes(order.value?.status))
const sortedLogs=computed(()=>[...(order.value?.logs||[])].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)))

const loadOrder=async()=>{
  try{
    order.value=await api.get(`/orders/admin/${route.params.id}`)
    if(order.value.quote_amount&&canQuote.value){
      quoteForm.value.amount=(order.value.quote_amount/100).toFixed(2)
      quoteForm.value.deposit=(order.value.deposit_amount/100).toFixed(2)
      quoteForm.value.days=order.value.quote_days||''
      quoteForm.value.note=order.value.quote_note||''
    }
    if(order.value.assigned_admin_id) assignId.value=order.value.assigned_admin_id
  }catch(e){console.log(e)}
}

const submitQuote=async()=>{
  const amount=Math.round(parseFloat(quoteForm.value.amount||'0')*100)
  if(!amount||amount<=0) return alert('请填写总价')
  let deposit=quoteForm.value.deposit!==''?Math.round(parseFloat(quoteForm.value.deposit)*100):Math.round(amount*0.3)
  if(deposit<0||deposit>amount) return alert('定金需在 0 ~ 总价之间')
  try{
    await api.post(`/orders/${order.value.id}/quote`,{
      amount, deposit_amount:deposit, days:quoteForm.value.days, note:quoteForm.value.note,
    })
    await loadOrder()
    alert('报价已发送给客户')
  }catch(e){alert(e.message||'报价失败')}
}

const onFileChosen=async(e)=>{
  const file=e.target.files[0]
  if(!file)return
  const fd=new FormData()
  fd.append('file',file)
  try{
    const r=await api.post('/upload/file',fd,{headers:{'Content-Type':'multipart/form-data'}})
    deliverForm.value.files.push(r.url)
  }catch(err){alert(err.message||'上传失败')}
  e.target.value=''
}

const submitDeliver=async()=>{
  if(!deliverForm.value.note&&!deliverForm.value.files.length&&!deliverForm.value.tracking) return alert('请填写交付说明或上传交付文件')
  if(!confirm('确认交付？交付后客户将收到尾款支付提示'))return
  try{
    await api.post(`/orders/${order.value.id}/deliver`,{
      note:deliverForm.value.note, files:deliverForm.value.files, tracking_no:deliverForm.value.tracking,
    })
    await loadOrder()
  }catch(e){alert(e.message||'交付失败')}
}

const doAssign=async()=>{
  if(!assignId.value)return alert('请选择成员')
  const a=admins.value.find(x=>x.id===assignId.value)
  try{
    await api.post(`/orders/${order.value.id}/assign`,{admin_id:a.id,admin_name:a.display_name||a.username})
    await loadOrder()
  }catch(e){alert(e.message||'分配失败')}
}

const doRemind=async()=>{
  try{
    await api.post(`/orders/${order.value.id}/remind`)
    await loadOrder()
    alert('已标记催付')
  }catch(e){alert(e.message||'操作失败')}
}

const doCancel=async()=>{
  const reason=prompt('取消原因：')
  if(reason===null)return
  try{
    await api.post(`/orders/admin/${order.value.id}/cancel`,{reason})
    await loadOrder()
  }catch(e){alert(e.message||'操作失败')}
}

// ============ 聊天 ============
const loadChat=async()=>{
  if(!sessionId.value)return
  try{
    const r=await api.get(`/chat/admin/messages/${sessionId.value}`)
    messages.value=r.list||[]
    await nextTick()
    if(msgBox.value)msgBox.value.scrollTop=msgBox.value.scrollHeight
  }catch(e){}
}
const initChat=async()=>{
  try{
    const s=await api.post('/chat/admin/order-session',{order_id:+route.params.id})
    sessionId.value=s.id
    await loadChat()
    await api.post(`/chat/admin/read/${sessionId.value}`)
    chatTimer=setInterval(loadChat,5000)
  }catch(e){console.log(e)}
}
const sendChat=async()=>{
  const text=chatInput.value.trim()
  if(!text||!sessionId.value)return
  chatInput.value=''
  try{
    await api.post(`/chat/admin/messages/${sessionId.value}`,{content:text})
    await loadChat()
  }catch(e){alert(e.message||'发送失败')}
}

onMounted(async()=>{
  await loadOrder()
  try{admins.value=await api.get('/admins')}catch(e){}
  initChat()
})
onUnmounted(()=>{if(chatTimer)clearInterval(chatTimer)})
</script>
<style scoped>
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.info-item{display:flex;flex-direction:column;gap:4px}
.info-label{font-size:12px;color:var(--text3)}.info-val{font-size:14px;color:var(--text1)}
.log-list{display:flex;flex-direction:column;gap:8px}
.log-item{display:flex;gap:12px;font-size:13px;color:var(--text2);padding:6px 0;border-bottom:1px solid var(--border)}
.log-time{color:var(--text3);flex-shrink:0}
.fld{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--text3)}
</style>
