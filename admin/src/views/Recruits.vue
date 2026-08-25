<template>
<div>
<div class="page-hd"><h2>纳新申请</h2></div>
<div style="display:flex;gap:10px;margin-bottom:16px">
  <button v-for="t in tabs" :key="t.key" @click="filterBy(t.key)" :class="'btn '+(activeTab===t.key?'btn-primary':'btn-outline')+' btn-sm'">{{t.label}}</button>
</div>
<div class="card">
  <table v-if="list.length" class="table">
    <thead><tr><th style="width:60px">ID</th><th>姓名</th><th>联系方式</th><th>方向</th><th>简介</th><th>作品</th><th>状态</th><th style="width:130px">提交时间</th><th style="width:210px">操作</th></tr></thead>
    <tbody><tr v-for="a in list" :key="a.id" class="row-click" @click="openDetail(a)">
      <td>{{a.id}}</td>
      <td>{{a.name}}</td>
      <td>{{a.contact}}</td>
      <td><span class="tag tag-blue">{{dirLabel(a.direction)}}</span></td>
      <td class="cell-ellipsis" style="max-width:200px">{{a.intro||'-'}}</td>
      <td class="cell-ellipsis" style="max-width:160px">{{a.works||'-'}}</td>
      <td><span :class="'tag '+(a.status==='approved'?'tag-green':a.status==='pending'?'tag-orange':'tag-red')">{{statusLabel(a.status)}}</span></td>
      <td>{{fmtTime(a.created_at)}}</td>
      <td>
        <button class="btn btn-outline btn-sm" @click.stop="openDetail(a)"><i class="ri-eye-line"></i>详情</button>
        <template v-if="a.status==='pending'">
          <button class="btn btn-success btn-sm" style="margin-left:4px" @click.stop="openAudit(a,true)">通过</button>
          <button class="btn btn-danger btn-sm" style="margin-left:4px" @click.stop="openAudit(a,false)">拒绝</button>
        </template>
        <button v-else-if="a.status==='approved'" class="btn btn-primary btn-sm" style="margin-left:4px" @click.stop="$router.push('/admins')">去创建账号<i class="ri-arrow-right-line"></i></button>
      </td>
    </tr></tbody>
  </table>
  <div v-else class="empty">
    <template v-if="!loaded"><i class="ri-loader-4-line"></i>加载中…</template>
    <template v-else>
      <i class="ri-team-line"></i>
      {{emptyText}}
      <p class="empty-sub">访客在客户端「加入我们」页提交申请后会出现在这里，点击任意一行可查看完整简介与作品。</p>
    </template>
  </div>
</div>
<p style="margin-top:12px;color:var(--text3);font-size:13px">提示：申请通过后，请在「团队成员」中为其创建后台账号。</p>

<!-- 详情抽屉 -->
<div v-if="detail" class="drawer-mask" @click.self="detail=null">
  <div class="drawer">
    <div class="drawer-hd">
      <h3><i class="ri-user-received-line"></i>申请详情 #{{detail.id}}</h3>
      <i class="ri-close-line drawer-close" @click="detail=null"></i>
    </div>
    <div class="drawer-body">
      <div class="d-grid">
        <div class="d-item"><label>姓名</label><span>{{detail.name}}</span></div>
        <div class="d-item"><label>联系方式</label><span>{{detail.contact}}</span></div>
        <div class="d-item"><label>意向方向</label><span class="tag tag-blue">{{dirLabel(detail.direction)}}</span></div>
        <div class="d-item"><label>状态</label><span :class="'tag '+(detail.status==='approved'?'tag-green':detail.status==='pending'?'tag-orange':'tag-red')">{{statusLabel(detail.status)}}</span></div>
        <div class="d-item"><label>提交时间</label><span>{{fmtTime(detail.created_at)}}</span></div>
        <div class="d-item"><label>审核时间</label><span>{{fmtTime(detail.audited_at)}}</span></div>
      </div>
      <div class="d-block">
        <label>个人简介</label>
        <p class="d-text">{{detail.intro||'（未填写）'}}</p>
      </div>
      <div class="d-block">
        <label>作品 / 经历</label>
        <p class="d-text" v-if="detail.works">
          <template v-for="(seg,i) in linkify(detail.works)" :key="i">
            <a v-if="seg.link" :href="seg.value" target="_blank" rel="noopener noreferrer">{{seg.value}}<i class="ri-external-link-line" style="font-size:12px"></i></a>
            <template v-else>{{seg.value}}</template>
          </template>
        </p>
        <p class="d-text" v-else>（未填写）</p>
      </div>
      <div class="d-block" v-if="detail.attachments?.length">
        <label>附件</label>
        <p class="d-text"><a v-for="(u,i) in detail.attachments" :key="i" :href="u" target="_blank" rel="noopener noreferrer" style="display:block">附件 {{i+1}}：{{u}}<i class="ri-external-link-line" style="font-size:12px"></i></a></p>
      </div>
      <div class="d-block" v-if="detail.status!=='pending'">
        <label>审核备注</label>
        <p class="d-text">{{detail.admin_remark||'（无备注）'}}</p>
      </div>
    </div>
    <div class="drawer-ft">
      <template v-if="detail.status==='pending'">
        <button class="btn btn-danger" @click="openAudit(detail,false)"><i class="ri-close-circle-line"></i>拒绝</button>
        <button class="btn btn-success" @click="openAudit(detail,true)"><i class="ri-check-line"></i>通过</button>
      </template>
      <template v-else-if="detail.status==='approved'">
        <span class="ft-hint">已通过，下一步为其创建后台账号</span>
        <button class="btn btn-primary" @click="$router.push('/admins')">去团队成员创建账号<i class="ri-arrow-right-line"></i></button>
      </template>
      <button v-else class="btn btn-outline" @click="detail=null">关闭</button>
    </div>
  </div>
</div>

<!-- 审核弹窗 -->
<div v-if="auditing" class="modal-mask" @click.self="!auditing.submitting&&(auditing=null)">
  <div class="modal-box" style="min-width:460px">
    <div class="modal-hd">
      <h3>{{auditing.approved?'通过申请':'拒绝申请'}}</h3>
      <i class="ri-close-line" style="cursor:pointer;font-size:20px" @click="auditing=null"></i>
    </div>
    <p class="audit-target">申请人：<b>{{auditing.app.name}}</b>（{{dirLabel(auditing.app.direction)}} · {{auditing.app.contact}}）</p>
    <div class="form-group">
      <label class="form-label">{{auditing.approved?'通过备注（可选）':'拒绝原因（必填）'}}</label>
      <textarea class="form-input" rows="3" v-model="auditing.remark" :placeholder="auditing.approved?'如：作品不错，安排跟进创建账号':'如：方向与当前团队需求不匹配'"></textarea>
    </div>
    <p v-if="auditing.error" class="form-err"><i class="ri-error-warning-line"></i>{{auditing.error}}</p>
    <div class="modal-ft">
      <button class="btn btn-outline" :disabled="auditing.submitting" @click="auditing=null">取消</button>
      <button :class="'btn '+(auditing.approved?'btn-success':'btn-danger')" :disabled="auditing.submitting" @click="submitAudit">
        {{auditing.submitting?'提交中…':(auditing.approved?'确认通过':'确认拒绝')}}
      </button>
    </div>
  </div>
</div>
</div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'

const list = ref([])
const loaded = ref(false)
const activeTab = ref('pending')
const detail = ref(null)
const auditing = ref(null)

const tabs = [{key:'pending',label:'待审核'},{key:'approved',label:'已通过'},{key:'rejected',label:'已拒绝'},{key:'',label:'全部'}]
const sl = {pending:'待审核',approved:'已通过',rejected:'已拒绝'}
const statusLabel = s => sl[s] || s
const dirLabel = d => ({software:'软件',electronics:'电子',both:'软件+电子'}[d] || d)
const fmtTime = v => v ? String(v).replace('T', ' ').slice(0, 16) : '-'
const emptyText = computed(() => ({pending:'暂无待审核申请',approved:'暂无已通过的申请',rejected:'暂无已拒绝的申请','':'暂无申请'}[activeTab.value]))

const filterBy = async k => {
  activeTab.value = k
  try {
    const params = {}
    if (k) params.status = k
    const r = await api.get('/recruit', { params })
    list.value = r.list || r || []
  } catch (e) {} finally { loaded.value = true }
}
onMounted(() => filterBy('pending'))

const openDetail = a => { detail.value = a }

// 作品文本中的 URL 转为可点击链接
const linkify = text => {
  const segs = []
  const re = /(https?:\/\/[^\s,，;；、]+)/g
  let last = 0, m
  const s = String(text)
  while ((m = re.exec(s))) {
    if (m.index > last) segs.push({ link: false, value: s.slice(last, m.index) })
    segs.push({ link: true, value: m[0] })
    last = m.index + m[0].length
  }
  if (last < s.length) segs.push({ link: false, value: s.slice(last) })
  return segs
}

const openAudit = (a, approved) => {
  auditing.value = { app: a, approved, remark: '', error: '', submitting: false }
}
const submitAudit = async () => {
  const ctx = auditing.value
  if (!ctx.approved && !ctx.remark.trim()) { ctx.error = '请填写拒绝原因'; return }
  ctx.submitting = true
  ctx.error = ''
  try {
    const saved = await api.put('/recruit/' + ctx.app.id + '/audit', { approved: ctx.approved, remark: ctx.remark.trim() })
    auditing.value = null
    if (detail.value && detail.value.id === ctx.app.id) detail.value = { ...detail.value, ...saved }
    await filterBy(activeTab.value)
  } catch (err) {
    ctx.error = err?.message || '操作失败，请重试'
    ctx.submitting = false
  }
}
</script>
<style scoped>
.row-click{cursor:pointer}
.cell-ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.empty-sub{font-size:13px;color:var(--text3);margin-top:6px;line-height:1.7}

.drawer-mask{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:1000}
.drawer{position:absolute;top:0;right:0;bottom:0;width:520px;max-width:90vw;background:#fff;box-shadow:-8px 0 32px rgba(0,0,0,.12);display:flex;flex-direction:column;animation:drawer-in .2s ease}
@keyframes drawer-in{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}
.drawer-hd{display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid var(--border);flex:none}
.drawer-hd h3{font-size:16px;display:flex;align-items:center;gap:8px}
.drawer-close{font-size:22px;cursor:pointer;color:var(--text3)}
.drawer-close:hover{color:var(--text)}
.drawer-body{flex:1;overflow-y:auto;padding:20px 24px}
.drawer-ft{flex:none;display:flex;justify-content:flex-end;align-items:center;gap:10px;padding:14px 24px;border-top:1px solid var(--border)}
.ft-hint{margin-right:auto;font-size:13px;color:var(--text3)}
.d-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 20px;margin-bottom:20px}
.d-item{display:flex;flex-direction:column;gap:4px}
.d-item label,.d-block label{font-size:12px;color:var(--text3)}
.d-block{margin-bottom:18px}
.d-text{margin-top:6px;font-size:14px;line-height:1.8;white-space:pre-wrap;word-break:break-all;background:#FAFAFA;border:1px solid var(--border);border-radius:6px;padding:12px 14px}
.d-text a{display:inline-flex;align-items:center;gap:2px;word-break:break-all}
.d-text a:hover{text-decoration:underline}

.audit-target{font-size:13px;color:var(--text2);margin-bottom:16px}
.form-err{display:flex;align-items:center;gap:4px;color:var(--danger);font-size:13px;margin-top:-6px}
</style>
