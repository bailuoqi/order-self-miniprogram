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
</div>
</template>
<script setup>
import { ref, computed, onMounted } from "vue"
import api from "@/api"
import { REFUND_STATUS_MAP, REFUND_STATUS_TAG, fmtFen } from "@/utils/order-status"
import { toast } from "@/components/ui/AppToast.vue"
import { appConfirm } from "@/components/ui/AppConfirm.vue"
const list=ref([])
const pendingCount=computed(()=>list.value.filter(r=>r.status==='pending').length)
const fetchList=async()=>{try{list.value=await api.get("/refunds")}catch(e){}}
onMounted(fetchList)
const openAudit=async(r,approved)=>{
  const message=[
    `订单：${r.order?.title||'-'}（${r.order?.order_no?.slice(0,14)||'-'}）`,
    `退款金额：¥${fmtFen(r.amount)}`,
    `申请原因：${r.reason||'-'}`,
    '',
    approved?'通过后订单转为「已退款」，请确认已线下完成退款操作。':'拒绝后订单恢复为申请前状态，拒绝原因将展示给客户。',
  ].join('\n')
  const done=await appConfirm({
    title:approved?'通过退款':'拒绝退款',
    message,
    confirmText:approved?'确认通过':'确认拒绝',
    variant:approved?'success':'danger',
    loadingText:'提交中...',
    input:{
      label:approved?'通过备注（选填）':'拒绝原因（必填）',
      placeholder:approved?'如：已原路退回定金':'如：制作已过半，可协商部分退款',
      required:!approved, requiredMessage:'拒绝退款必须填写原因', rows:3,
    },
    onConfirm:async(remark)=>{
      await api.put(approved?"/refunds/"+r.id+"/approve":"/refunds/"+r.id+"/reject",{remark})
    },
  })
  if(!done)return
  await fetchList()
  toast(approved?"已通过退款申请":"已拒绝退款申请",'success')
}
</script>
<style scoped>
.pending-hint{font-size:13px;color:var(--warning);display:inline-flex;align-items:center;gap:4px}
.order-link{display:flex;flex-direction:column;gap:2px;min-width:0}
.order-title{color:var(--text);font-size:13px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.order-no{color:var(--primary);font-size:12px}
.order-link:hover .order-title{color:var(--primary)}
.reason{display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom}
</style>
