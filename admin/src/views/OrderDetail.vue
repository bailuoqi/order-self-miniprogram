<template>
<div><div class="page-hd"><h2>订单处理</h2><button class="btn btn-outline btn-sm" @click="$router.push('/orders')"><i class="ri-arrow-left-line"></i> 返回</button></div>
<div v-if="order" class="detail-grid">
  <!-- 左列：订单信息与操作 -->
  <div style="min-width:0">
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
          <span class="info-val"><a v-for="(f,i) in order.attachments" :key="i" :href="fileUrl(f)" target="_blank" style="margin-right:12px"><i class="ri-attachment-2"></i> {{fileName(f)||('附件'+(i+1))}}</a></span>
        </div>
      </div>
    </div>

    <!-- 报价 -->
    <div class="card" style="margin-bottom:16px">
      <h3 style="margin-bottom:12px">报价{{order.quote_amount?'（可修改，确认前有效）':''}}</h3>
      <div v-if="canQuote" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px">
        <label class="fld">总价（元）<input v-model="quoteForm.amount" type="number" min="0" step="0.01" class="input" placeholder="如 3000" @input="onAmountInput" /></label>
        <label class="fld">定金（元）<input v-model="quoteForm.deposit" type="number" min="0" step="0.01" class="input" :placeholder="'留空按 '+depositRatio+'% 计算'" @input="depositTouched=true" /></label>
        <label class="fld">预计工期<input v-model="quoteForm.days" class="input" placeholder="如 15天" /></label>
        <label class="fld" style="grid-column:span 2">交付说明（合约要点）<textarea v-model="quoteForm.note" class="input" rows="3" placeholder="交付物、验收标准、修改次数等"></textarea></label>
      </div>
      <div v-if="canQuote&&balancePreview" class="calc-line" :class="{err:balancePreview.invalid}">
        <template v-if="balancePreview.invalid"><i class="ri-error-warning-line"></i> 定金需在 0 ~ 总价之间</template>
        <template v-else><i class="ri-calculator-line"></i> 尾款 = 总价 − 定金 = <b>¥{{balancePreview.balance.toFixed(2)}}</b>（定金占 {{balancePreview.ratio}}%）</template>
      </div>
      <div v-if="canQuote" style="display:flex;gap:10px;align-items:center;margin-top:10px">
        <button class="btn btn-primary" :disabled="quoteSubmitting" @click="submitQuote">{{quoteSubmitting?'提交中...':(order.quote_amount?'更新报价':'提交报价')}}</button>
        <span style="color:var(--text3);font-size:12px">定金默认按系统设置比例 {{depositRatio}}% 预填，可修改</span>
      </div>
      <div v-if="order.quote_amount" style="margin-top:12px;padding:12px;background:var(--bg2,#f7f8fa);border-radius:8px;display:flex;gap:24px;flex-wrap:wrap">
        <span>总价 <b style="color:#E65100">¥{{fmt(order.quote_amount)}}</b></span>
        <span>定金 <b>¥{{fmt(order.deposit_amount)}}</b>{{order.deposit_paid_at?' ✓已付':''}}</span>
        <span>尾款 <b>¥{{fmt(order.final_amount)}}</b>{{order.final_paid_at?' ✓已付':''}}</span>
        <span>工期 <b>{{order.quote_days||'-'}}</b></span>
      </div>
      <div v-if="sortedQuotes.length" style="margin-top:14px">
        <div style="font-size:12px;color:var(--text3);margin-bottom:6px">报价历史（最新在上）</div>
        <div class="timeline">
          <div v-for="(q,i) in sortedQuotes" :key="q.id" class="tl-item" :class="{latest:i===0}">
            <span class="tl-dot"></span>
            <div class="tl-body">
              <div class="tl-main">¥{{fmt(q.amount)}} <span class="tl-sub">定金 ¥{{fmt(q.deposit_amount)}} · 工期 {{q.days||'-'}}</span>
                <span v-if="q.is_confirmed" class="tag tag-green" style="margin-left:6px">客户已确认</span>
                <span v-else-if="i===0" class="tag tag-blue" style="margin-left:6px">最新</span>
              </div>
              <div class="tl-meta">{{q.created_by}} · {{q.created_at?.slice(0,16)}}</div>
              <div v-if="q.note" class="tl-note">{{q.note}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 交付 -->
    <div class="card" style="margin-bottom:16px" v-if="order.status==='deposit_paid'||order.delivered_at">
      <h3 style="margin-bottom:12px">交付成果</h3>
      <template v-if="order.status==='deposit_paid'">
        <label class="fld" style="margin-bottom:10px">交付说明<textarea v-model="deliverForm.note" class="input" rows="3" placeholder="交付内容说明、使用方式、验收要点"></textarea></label>
        <div style="margin-bottom:10px">
          <div style="font-size:12px;color:var(--text3);margin-bottom:6px">交付文件（图片/pdf/zip，可一次选择多个）</div>
          <div v-for="(f,i) in deliverForm.files" :key="f.url" class="file-row">
            <i class="ri-file-3-line file-ic"></i>
            <a :href="fileUrl(f.url)" target="_blank" class="file-name" :title="f.name">{{f.name}}</a>
            <span class="file-size">{{fmtBytes(f.size)}}</span>
            <button class="btn btn-outline btn-sm" @click="removeFile(i)"><i class="ri-delete-bin-line"></i> 删除</button>
          </div>
          <input type="file" ref="fileInput" multiple style="display:none" @change="onFilesChosen" />
          <button class="btn btn-outline btn-sm" :disabled="uploading" @click="$refs.fileInput.click()">
            <i :class="uploading?'ri-loader-4-line spin':'ri-upload-2-line'"></i> {{uploading?('上传中 '+uploadProgress+'...'):'上传文件（可多选）'}}
          </button>
        </div>
        <label class="fld" style="margin-bottom:12px">快递单号（电子类实物，选填）<input v-model="deliverForm.tracking" class="input" placeholder="如 SF1234567890" /></label>
        <button class="btn btn-primary" :disabled="uploading" @click="submitDeliver">确认交付，通知客户付尾款</button>
      </template>
      <template v-else>
        <div class="info-grid">
          <div class="info-item" style="grid-column:span 2"><span class="info-label">交付说明</span><span class="info-val" style="white-space:pre-line">{{order.delivery_note||'-'}}</span></div>
          <div class="info-item" v-if="order.delivery_files?.length" style="grid-column:span 2">
            <span class="info-label">交付文件</span>
            <span class="info-val"><a v-for="(f,i) in order.delivery_files" :key="i" :href="fileUrl(f)" target="_blank" style="margin-right:12px"><i class="ri-attachment-2"></i> {{fileName(f)||('文件'+(i+1))}}</a></span>
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
        <button v-if="canCancel" class="btn btn-danger" @click="openCancel">取消订单</button>
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

  <!-- 右列：与客户沟通（sticky，1366 不折行） -->
  <div class="card chat-col">
    <h3 style="margin-bottom:12px;flex-shrink:0">与客户沟通</h3>
    <div ref="msgBox" class="msg-box">
      <div v-for="m in messages" :key="m.id" :style="{alignSelf:m.from_team?'flex-end':'flex-start',maxWidth:'80%'}">
        <div style="font-size:11px;color:var(--text3);margin-bottom:2px" :style="{textAlign:m.from_team?'right':'left'}">{{m.from_team?(m.sender_name||'团队'):'客户'}} · {{m.created_at?.slice(11,16)}}</div>
        <a v-if="isImageMsg(m)" :href="m.content" target="_blank" class="msg-img-wrap"><img :src="m.content" class="msg-img" alt="图片消息" /></a>
        <div v-else :style="{background:m.from_team?'#E3F2FD':'#f5f5f5',padding:'8px 12px',borderRadius:'8px',fontSize:'13px',wordBreak:'break-all'}">{{m.content}}</div>
      </div>
      <p v-if="!messages.length" style="text-align:center;color:var(--text3);padding:30px 0;font-size:13px">暂无消息，可主动与客户沟通报价</p>
    </div>
    <div style="display:flex;gap:8px;margin-top:10px;flex-shrink:0">
      <input v-model="chatInput" class="input" style="flex:1" placeholder="输入消息..." :disabled="sending" @keyup.enter="sendChat" />
      <button class="btn btn-primary" :disabled="sending||!chatInput.trim()" @click="sendChat">{{sending?'发送中':'发送'}}</button>
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
import { ORDER_STATUS_MAP, ORDER_STATUS_TAG, fmtFen, fmtBytes, isUploadImageUrl } from "@/utils/order-status"
import { toast } from "@/components/ui/AppToast.vue"
import { appConfirm } from "@/components/ui/AppConfirm.vue"

const route=useRoute()
const order=ref(null)
const admins=ref([])
const assignId=ref(0)
const quoteForm=ref({amount:'',deposit:'',days:'',note:''})
const quoteSubmitting=ref(false)
// deliverForm.files 存 {url,name,size}（提交时仅取 url，兼容客户端既有渲染）
const deliverForm=ref({note:'',files:[],tracking:''})
const fileInput=ref(null)
const uploading=ref(false)
const uploadProgress=ref('')

const depositRatio=ref(30)
const depositTouched=ref(false)

const sessionId=ref(0)
const messages=ref([])
const chatInput=ref('')
const sending=ref(false)
const msgBox=ref(null)
let chatTimer=null

const label=s=>ORDER_STATUS_MAP[s]||s
const tagClass=s=>ORDER_STATUS_TAG[s]||""
const fmt=fmtFen
const fileUrl=f=>f
const fileName=f=>{
  if(typeof f!=='string')return ''
  try{return decodeURIComponent(f.split('/').pop().split('?')[0])}catch(e){return f.split('/').pop()}
}
const isImageMsg=m=>m.type==='image'||isUploadImageUrl(m.content)

const canQuote=computed(()=>['pending_quote','quoting'].includes(order.value?.status))
const canCancel=computed(()=>['pending_quote','quoting','confirmed'].includes(order.value?.status))
const sortedLogs=computed(()=>[...(order.value?.logs||[])].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)))
const sortedQuotes=computed(()=>[...(order.value?.quotes||[])].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)))

/** 输入联动：尾款 = 总价 − 定金（定金留空按默认比例估算） */
const balancePreview=computed(()=>{
  const a=parseFloat(quoteForm.value.amount)
  if(!isFinite(a)||a<=0)return null
  const d=quoteForm.value.deposit!==''?parseFloat(quoteForm.value.deposit):a*depositRatio.value/100
  if(!isFinite(d))return null
  return {balance:Math.max(0,a-d),ratio:Math.round(d/a*100),invalid:d<0||d>a}
})

/** 报价定金预填比例：读系统设置（S6 T24 写入的 page-config/settings），异常/为空回退 30% */
const loadDepositRatio=async()=>{
  try{
    const cfg=await api.get('/page-config/settings')
    let r=parseFloat(cfg?.deposit_ratio ?? cfg?.depositRatio)
    if(isFinite(r)&&r>0&&r<1)r*=100
    if(isFinite(r)&&r>0&&r<=100)depositRatio.value=Math.round(r*100)/100
  }catch(e){/* 设置不可用时静默回退 30% */}
}

const onAmountInput=()=>{
  if(depositTouched.value)return
  const a=parseFloat(quoteForm.value.amount)
  quoteForm.value.deposit=isFinite(a)&&a>0?(a*depositRatio.value/100).toFixed(2):''
}

const loadOrder=async()=>{
  try{
    order.value=await api.get(`/orders/admin/${route.params.id}`)
    if(order.value.quote_amount&&canQuote.value){
      quoteForm.value.amount=(order.value.quote_amount/100).toFixed(2)
      quoteForm.value.deposit=(order.value.deposit_amount/100).toFixed(2)
      quoteForm.value.days=order.value.quote_days||''
      quoteForm.value.note=order.value.quote_note||''
      depositTouched.value=true
    }
    if(order.value.assigned_admin_id) assignId.value=order.value.assigned_admin_id
  }catch(e){console.log(e)}
}

const submitQuote=async()=>{
  const amount=Math.round(parseFloat(quoteForm.value.amount||'0')*100)
  if(!amount||amount<=0) return toast('请填写总价','error')
  let deposit=quoteForm.value.deposit!==''?Math.round(parseFloat(quoteForm.value.deposit)*100):Math.round(amount*depositRatio.value/100)
  if(isNaN(deposit)||deposit<0||deposit>amount) return toast('定金需在 0 ~ 总价之间','error')
  quoteSubmitting.value=true
  try{
    await api.post(`/orders/${order.value.id}/quote`,{
      amount, deposit_amount:deposit, days:quoteForm.value.days, note:quoteForm.value.note,
    })
    await loadOrder()
    toast('报价已发送给客户','success')
  }catch(e){toast(e.message||'报价失败','error')}
  quoteSubmitting.value=false
}

const onFilesChosen=async(e)=>{
  const files=Array.from(e.target.files||[])
  e.target.value=''
  if(!files.length)return
  uploading.value=true
  let ok=0
  for(let i=0;i<files.length;i++){
    uploadProgress.value=`${i+1}/${files.length}`
    const f=files[i]
    const fd=new FormData()
    fd.append('file',f)
    try{
      const r=await api.post('/upload/file',fd,{headers:{'Content-Type':'multipart/form-data'}})
      deliverForm.value.files.push({url:r.url,name:f.name,size:f.size})
      ok++
    }catch(err){toast(`「${f.name}」上传失败：${err.message||'请重试'}`,'error')}
  }
  uploading.value=false
  uploadProgress.value=''
  if(ok===files.length)toast(`已上传 ${ok} 个文件`,'success')
}

const removeFile=async(i)=>{
  const f=deliverForm.value.files[i]
  const ok=await appConfirm({
    title:'删除交付文件',
    message:`确定移除「${f.name}」？提交交付前可重新上传。`,
    danger:true, confirmText:'删除',
  })
  if(ok)deliverForm.value.files.splice(i,1)
}

const submitDeliver=async()=>{
  if(!deliverForm.value.note&&!deliverForm.value.files.length&&!deliverForm.value.tracking)
    return toast('请填写交付说明或上传交付文件','error')
  const ok=await appConfirm({
    title:'确认交付',
    message:`确认交付本单${deliverForm.value.files.length?`（含 ${deliverForm.value.files.length} 个交付文件）`:''}？交付后客户将收到尾款支付提示。`,
    confirmText:'确认交付',
  })
  if(ok)await doDeliver()
}
const doDeliver=async()=>{
  try{
    await api.post(`/orders/${order.value.id}/deliver`,{
      note:deliverForm.value.note,
      files:deliverForm.value.files.map(f=>f.url),
      tracking_no:deliverForm.value.tracking,
    })
    await loadOrder()
    toast('已交付，客户将收到尾款支付提示','success')
  }catch(e){toast(e.message||'交付失败','error')}
}

const doAssign=async()=>{
  if(!assignId.value)return toast('请选择成员','error')
  const a=admins.value.find(x=>x.id===assignId.value)
  try{
    await api.post(`/orders/${order.value.id}/assign`,{admin_id:a.id,admin_name:a.display_name||a.username})
    await loadOrder()
    toast('已分配负责成员','success')
  }catch(e){toast(e.message||'分配失败','error')}
}

const doRemind=async()=>{
  try{
    await api.post(`/orders/${order.value.id}/remind`)
    await loadOrder()
    toast('已标记催付','success')
  }catch(e){toast(e.message||'操作失败','error')}
}

const openCancel=async()=>{
  const done=await appConfirm({
    title:'取消订单',
    message:'取消后订单不可恢复，客户将收到取消通知。',
    confirmText:'确认取消订单', cancelText:'再想想', danger:true, loadingText:'提交中...',
    input:{
      label:'取消原因（必填）', placeholder:'如：客户需求变更 / 双方未达成一致',
      required:true, requiredMessage:'请填写取消原因', rows:3,
    },
    onConfirm:async(reason)=>{await api.post(`/orders/admin/${order.value.id}/cancel`,{reason})},
  })
  if(!done)return
  await loadOrder()
  toast('订单已取消','success')
}

// ============ 聊天 ============
const loadChat=async()=>{
  if(!sessionId.value)return
  try{
    const r=await api.get(`/chat/admin/messages/${sessionId.value}`)
    const grew=(r.list||[]).length>messages.value.length
    messages.value=r.list||[]
    if(grew){
      await nextTick()
      if(msgBox.value)msgBox.value.scrollTop=msgBox.value.scrollHeight
    }
  }catch(e){}
}
const initChat=async()=>{
  try{
    const s=await api.post('/chat/admin/order-session',{order_id:+route.params.id})
    sessionId.value=s.id
    await loadChat()
    await nextTick()
    if(msgBox.value)msgBox.value.scrollTop=msgBox.value.scrollHeight
    await api.post(`/chat/admin/read/${sessionId.value}`)
    chatTimer=setInterval(loadChat,5000)
  }catch(e){console.log(e)}
}
const sendChat=async()=>{
  const text=chatInput.value.trim()
  if(!text||!sessionId.value||sending.value)return
  sending.value=true
  try{
    await api.post(`/chat/admin/messages/${sessionId.value}`,{content:text})
    chatInput.value=''
    await loadChat()
    await nextTick()
    if(msgBox.value)msgBox.value.scrollTop=msgBox.value.scrollHeight
  }catch(e){toast(e.message||'发送失败','error')}
  sending.value=false
}

onMounted(async()=>{
  loadDepositRatio()
  await loadOrder()
  try{admins.value=await api.get('/admins')}catch(e){}
  initChat()
})
onUnmounted(()=>{
  if(chatTimer)clearInterval(chatTimer)
})
</script>
<style scoped>
/* 双栏：左信息流自适应 + 右聊天列定宽，1366 不再折行 */
.detail-grid{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:16px;align-items:start}
@media (max-width:1440px){.detail-grid{grid-template-columns:minmax(0,1fr) 340px}}
.chat-col{position:sticky;top:24px;height:calc(100vh - 140px);min-height:420px;display:flex;flex-direction:column}
.msg-box{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:4px}
.msg-img-wrap{display:block}
.msg-img{max-width:180px;max-height:180px;border-radius:8px;display:block;border:1px solid var(--border);object-fit:cover}

.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.info-item{display:flex;flex-direction:column;gap:4px}
.info-label{font-size:12px;color:var(--text3)}.info-val{font-size:14px;color:var(--text)}
.log-list{display:flex;flex-direction:column;gap:8px}
.log-item{display:flex;gap:12px;font-size:13px;color:var(--text2);padding:6px 0;border-bottom:1px solid var(--border)}
.log-time{color:var(--text3);flex-shrink:0}
.fld{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--text3)}

/* 报价联动计算行 */
.calc-line{font-size:13px;color:var(--text2);background:#F5F9FF;border:1px solid #DCE9FB;border-radius:6px;padding:8px 12px;display:flex;align-items:center;gap:6px}
.calc-line b{color:#E65100}
.calc-line.err{background:#FFF3F0;border-color:#FFD9CF;color:var(--danger)}

/* 报价历史时间线 */
.timeline{position:relative;padding-left:18px}
.timeline::before{content:'';position:absolute;left:5px;top:10px;bottom:10px;width:2px;background:var(--border)}
.tl-item{position:relative;padding:4px 0 12px}
.tl-item:last-child{padding-bottom:2px}
.tl-dot{position:absolute;left:-17px;top:10px;width:8px;height:8px;border-radius:50%;background:#C6CBD4;border:2px solid #fff;box-shadow:0 0 0 1px var(--border)}
.tl-item.latest .tl-dot{background:var(--primary);box-shadow:0 0 0 1px var(--primary)}
.tl-main{font-size:14px;color:var(--text);font-weight:500}
.tl-sub{font-size:12px;color:var(--text2);font-weight:400;margin-left:4px}
.tl-meta{font-size:12px;color:var(--text3);margin-top:2px}
.tl-note{font-size:12px;color:var(--text2);margin-top:4px;background:#FAFAFA;border-radius:6px;padding:6px 10px;white-space:pre-line}

/* 交付文件行 */
.file-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:13px;padding:6px 10px;background:#FAFAFA;border-radius:6px;border:1px solid var(--border)}
.file-ic{color:var(--primary);font-size:16px;flex-shrink:0}
.file-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.file-size{color:var(--text3);font-size:12px;flex-shrink:0}
.spin{display:inline-block;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
