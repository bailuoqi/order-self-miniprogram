<template>
<div><div class="page-hd"><h2>退款审核</h2><span v-if="pendingCount" class="pending-hint"><i class="ri-error-warning-line"></i> {{pendingCount}} 笔待审核</span></div>
<div class="card">
  <table class="table"><thead><tr><th>编号</th><th>订单</th><th>金额(元)</th><th>申请原因</th><th>状态</th><th>申请时间</th><th>审核备注</th><th>操作</th></tr></thead>
    <tbody><tr v-for="r in list" :key="r.id">
      <td>{{r.refund_no}}</td>
      <td>
        <router-link :to="'/orders/'+r.order_id" class="order-link" :title="'打开订单 '+(r.order?.order_no||'')">
          <span class="order-title">{{r.order?.title||'（订单已不存在）'}}</span>
          <span class="order-no">{{r.order?.order_no?.slice(0,14)}} <i class="ri-external-link-line"></i></span>
        </router-link>
      </td>
      <td><b style="color:#E65100">{{fmtFen(r.amount)}}</b></td>
      <td style="max-width:240px"><span class="reason" :title="r.reason">{{r.reason||'-'}}</span></td>
      <td><span :class="'tag '+(REFUND_STATUS_TAG[r.status]||'tag-blue')">{{REFUND_STATUS_MAP[r.status]||r.status}}</span></td>
      <td>{{r.created_at?.slice(0,16)}}</td>
      <td style="max-width:180px"><span class="reason" :title="r.admin_remark">{{r.admin_remark||'-'}}</span></td>
      <td>
        <template v-if="r.status==='pending'">
          <button class="btn btn-success btn-sm" @click="openAudit(r,true)">通过</button>
          <button class="btn btn-danger btn-sm" style="margin-left:6px" @click="openAudit(r,false)">拒绝</button>
        </template>
        <span v-else style="color:var(--text3);font-size:12px">{{r.audited_at?.slice(0,16)||'-'}}</span>
      </td>
    </tr></tbody>
  </table>
  <p v-if="!list.length" class="empty"><i class="ri-inbox-line"></i>暂无退款申请</p>
</div>

<!-- 审核弹窗（替代 prompt，拒绝原因必填） -->
<div class="modal-mask" v-if="auditing" @click.self="auditing=null"><div class="modal-box">
  <div class="modal-hd"><h3>{{auditing.approved?'通过退款':'拒绝退款'}}</h3><i class="ri-close-line" style="cursor:pointer;font-size:20px" @click="auditing=null"></i></div>
  <div class="audit-ctx">
    <div class="ctx-row"><span class="ctx-label">订单</span><span>{{auditing.refund.order?.title||'-'}}（{{auditing.refund.order?.order_no?.slice(0,14)}}）</span></div>
    <div class="ctx-row"><span class="ctx-label">退款金额</span><b style="color:#E65100">¥{{fmtFen(auditing.refund.amount)}}</b></div>
    <div class="ctx-row"><span class="ctx-label">申请原因</span><span style="white-space:pre-line">{{auditing.refund.reason||'-'}}</span></div>
  </div>
  <p v-if="auditing.approved" style="font-size:13px;color:var(--text2);margin-bottom:12px">通过后订单转为「已退款」，请确认已线下完成退款操作。</p>
  <p v-else style="font-size:13px;color:var(--text2);margin-bottom:12px">拒绝后订单恢复为申请前状态，拒绝原因将展示给客户。</p>
  <div class="form-group">
    <label class="form-label">{{auditing.approved?'通过备注（选填）':'拒绝原因（必填）'}}</label>
    <textarea class="form-input" v-model="remark" rows="3" :placeholder="auditing.approved?'如：已原路退回定金':'如：制作已过半，可协商部分退款'"></textarea>
    <p v-if="auditErr" class="field-err">{{auditErr}}</p>
  </div>
  <div class="modal-ft">
    <button class="btn btn-outline" @click="auditing=null">取消</button>
    <button :class="'btn '+(auditing.approved?'btn-success':'btn-danger')" :disabled="submitting" @click="submitAudit">{{submitting?'提交中...':(auditing.approved?'确认通过':'确认拒绝')}}</button>
  </div>
</div></div>

<!-- 轻提示（替代 alert） -->
<transition name="toast-fade"><div v-if="toast" class="toast" :class="'toast-'+toast.type">
  <i :class="toast.type==='success'?'ri-checkbox-circle-fill':'ri-close-circle-fill'"></i>{{toast.text}}
</div></transition>
</div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import api from "@/api"
import { REFUND_STATUS_MAP, REFUND_STATUS_TAG, fmtFen } from "@/utils/order-status"
const list=ref([])
const auditing=ref(null)
const remark=ref("")
const auditErr=ref("")
const submitting=ref(false)
const toast=ref(null)
let toastTimer=null
const showToast=(text,type='success')=>{
  toast.value={text,type}
  clearTimeout(toastTimer)
  toastTimer=setTimeout(()=>toast.value=null,2600)
}
const pendingCount=computed(()=>list.value.filter(r=>r.status==='pending').length)
const fetchList=async()=>{try{list.value=await api.get("/refunds")}catch(e){}}
onMounted(fetchList)
onUnmounted(()=>clearTimeout(toastTimer))
const openAudit=(r,approved)=>{
  remark.value=""
  auditErr.value=""
  auditing.value={id:r.id,approved,refund:r}
}
const submitAudit=async()=>{
  const {id,approved}=auditing.value
  if(!approved&&!remark.value.trim()){auditErr.value="拒绝退款必须填写原因";return}
  auditErr.value=""
  submitting.value=true
  try{
    const url=approved?"/refunds/"+id+"/approve":"/refunds/"+id+"/reject"
    await api.put(url,{remark:remark.value.trim()})
    auditing.value=null
    await fetchList()
    showToast(approved?"已通过退款申请":"已拒绝退款申请")
  }catch(e){auditErr.value=e.message||"操作失败"}
  submitting.value=false
}
</script>
<style scoped>
.pending-hint{font-size:13px;color:var(--warning);display:inline-flex;align-items:center;gap:4px}
.order-link{display:flex;flex-direction:column;gap:2px;min-width:0}
.order-title{color:var(--text);font-size:13px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.order-no{color:var(--primary);font-size:12px}
.order-link:hover .order-title{color:var(--primary)}
.reason{display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom}
.audit-ctx{background:#FAFAFA;border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:14px;display:flex;flex-direction:column;gap:8px}
.ctx-row{display:flex;gap:10px;font-size:13px;color:var(--text)}
.ctx-label{color:var(--text3);flex-shrink:0;width:60px}
.field-err{color:var(--danger);font-size:12px;margin-top:6px}
.toast{position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:2000;display:flex;align-items:center;gap:8px;padding:10px 20px;border-radius:8px;font-size:14px;box-shadow:0 6px 24px rgba(0,0,0,.12);background:#fff;color:var(--text)}
.toast i{font-size:17px}
.toast-success i{color:var(--success)}
.toast-error i{color:var(--danger)}
.toast-fade-enter-active,.toast-fade-leave-active{transition:all .25s}
.toast-fade-enter-from,.toast-fade-leave-to{opacity:0;transform:translate(-50%,-8px)}
</style>
