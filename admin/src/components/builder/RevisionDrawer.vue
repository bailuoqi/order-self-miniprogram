<template>
<div class="rd-mask" @click.self="$emit('close')">
  <div class="rd-drawer">
    <div class="rd-head">
      <span class="rd-head-title"><i class="ri-time-line"></i> 发布历史</span>
      <button type="button" class="rd-close" title="关闭" @click="$emit('close')"><i class="ri-close-line"></i></button>
    </div>
    <div class="rd-hint">每次发布 / 回滚记录一条；回滚会把所选版本写回线上（{{ pageKey }}）与草稿（{{ pageKey }}-draft）。</div>
    <div class="rd-body">
      <div v-if="state==='loading'" class="rd-tip"><i class="ri-loader-4-line rd-spin"></i> 加载中…</div>
      <div v-else-if="state==='error'" class="rd-tip">发布历史加载失败 <button type="button" class="rd-retry" @click="load">重试</button></div>
      <div v-else-if="!list.length" class="rd-tip">暂无发布记录（完成一次发布后生成）</div>
      <div v-else class="rd-list">
        <div v-for="(r,i) in list" :key="r.id" class="rd-item">
          <div class="rd-item-main">
            <span :class="['rd-action', r.action==='rollback' ? 'rb' : 'pub']">{{ r.action==='rollback' ? '回滚' : '发布' }}</span>
            <span class="rd-time">{{ fmtTime(r.created_at) }}</span>
            <span v-if="i===0" class="rd-latest">最新</span>
          </div>
          <div class="rd-item-sub">
            <span class="rd-operator"><i class="ri-user-3-line"></i> {{ r.operator || '—' }}</span>
            <span class="rd-summary">{{ fmtSummary(r.summary) }}</span>
          </div>
          <button type="button" class="rd-rollback" :disabled="rolling" @click="askRollback(r)">
            <i class="ri-arrow-go-back-line"></i> {{ rolling && confirmRev && confirmRev.id===r.id ? '回滚中…' : '回滚到此版本' }}
          </button>
        </div>
      </div>
      <div v-if="errMsg" class="rd-err"><i class="ri-error-warning-line"></i> {{ errMsg }}</div>
    </div>
  </div>
  <div v-if="confirmRev && !rolling" class="rd-confirm-mask">
    <div class="rd-confirm">
      <h4><i class="ri-error-warning-line" style="color:#faad14"></i> 回滚确认</h4>
      <p>回滚会把「{{ fmtTime(confirmRev.created_at) }}」的版本写回线上与草稿，画布将重载为该版本，当前未保存 / 未发布的修改将被覆盖。确定回滚？</p>
      <div class="rd-confirm-btns">
        <button type="button" class="rd-btn-outline" @click="confirmRev=null">取消</button>
        <button type="button" class="rd-btn" @click="doRollback">确定回滚</button>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
// 发布历史抽屉：列 GET /page-config/:key/revisions（时间/操作人/摘要），
// 回滚走 POST /page-config/:key/rollback；接口不可用时由父组件整体隐藏入口（PageBuilder 探测）。
import { ref, onMounted } from 'vue'
import api from '@/api'

const props = defineProps({ pageKey: { type: String, default: 'home' } })
const emit = defineEmits(['close', 'rolled-back'])

const list = ref([])
const state = ref('loading')
const errMsg = ref('')
const confirmRev = ref(null)
const rolling = ref(false)

async function load() {
  state.value = 'loading'
  errMsg.value = ''
  try {
    const res = await api.get(`/page-config/${props.pageKey}/revisions`)
    list.value = Array.isArray(res) ? res : (res && Array.isArray(res.list) ? res.list : [])
    state.value = 'done'
  } catch (e) {
    state.value = 'error'
  }
}

function askRollback(r) {
  errMsg.value = ''
  confirmRev.value = r
}

async function doRollback() {
  if (!confirmRev.value) return
  rolling.value = true
  try {
    await api.post(`/page-config/${props.pageKey}/rollback`, { revisionId: confirmRev.value.id })
    emit('rolled-back')
  } catch (e) {
    errMsg.value = '回滚失败：' + ((e && e.message) || '请求异常，请重试')
  } finally {
    rolling.value = false
    confirmRev.value = null
  }
}

function fmtTime(t) {
  if (!t) return '—'
  const d = new Date(t)
  if (isNaN(d.getTime())) return String(t)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function fmtSummary(s) {
  if (s == null || s === '') return ''
  if (typeof s === 'string') return s
  if (typeof s === 'object') {
    const n = s.componentCount != null ? s.componentCount : s.components
    if (n != null && (typeof n === 'number' || typeof n === 'string')) return `组件 ${n} 个`
    try { return JSON.stringify(s) } catch (e) { return '' }
  }
  return String(s)
}

onMounted(load)
</script>

<style scoped>
.rd-mask{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:1000}
.rd-drawer{position:absolute;top:0;right:0;bottom:0;width:380px;max-width:92vw;background:#fff;box-shadow:-8px 0 32px rgba(0,0,0,.15);display:flex;flex-direction:column;animation:rd-in .18s ease}
@keyframes rd-in{from{transform:translateX(30px);opacity:0}to{transform:none;opacity:1}}
.rd-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;border-bottom:1px solid #f0f0f0}
.rd-head-title{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;color:#333}
.rd-close{background:none;border:none;cursor:pointer;font-size:18px;color:#999;padding:2px}
.rd-close:hover{color:#333}
.rd-hint{padding:8px 16px;font-size:11px;color:#999;line-height:1.5;background:#fafafa;border-bottom:1px solid #f0f0f0}
.rd-body{flex:1;overflow-y:auto;padding:12px 16px}
.rd-tip{padding:40px 0;text-align:center;color:#999;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px}
.rd-retry{border:1px solid #d9d9d9;background:#fff;border-radius:4px;padding:2px 10px;cursor:pointer;color:#2979FF;font-size:12px}
.rd-list{display:flex;flex-direction:column;gap:10px}
.rd-item{border:1px solid #f0f0f0;border-radius:8px;padding:10px 12px}
.rd-item-main{display:flex;align-items:center;gap:8px}
.rd-action{font-size:11px;padding:1px 8px;border-radius:8px;flex-shrink:0}
.rd-action.pub{background:#e6f7ee;color:#237804;border:1px solid #b7eb8f}
.rd-action.rb{background:#fff7e6;color:#d46b08;border:1px solid #ffd591}
.rd-time{font-size:12px;color:#333;font-weight:600}
.rd-latest{font-size:10px;color:#2979FF;background:#f0f6ff;border:1px solid #a9c8ff;border-radius:8px;padding:0 6px;line-height:1.6}
.rd-item-sub{display:flex;align-items:center;gap:12px;margin-top:6px;font-size:11px;color:#999}
.rd-operator{display:flex;align-items:center;gap:3px}
.rd-summary{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.rd-rollback{margin-top:8px;border:1px solid #d9d9d9;background:#fff;border-radius:6px;padding:4px 10px;font-size:12px;color:#555;cursor:pointer;display:inline-flex;align-items:center;gap:4px}
.rd-rollback:hover:not(:disabled){border-color:#2979FF;color:#2979FF}
.rd-rollback:disabled{opacity:.5;cursor:not-allowed}
.rd-err{margin-top:10px;font-size:12px;color:#ff4d4f;display:flex;align-items:center;gap:4px}
.rd-spin{animation:rd-spin .8s linear infinite}
@keyframes rd-spin{to{transform:rotate(360deg)}}
.rd-confirm-mask{position:absolute;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:10}
.rd-confirm{background:#fff;border-radius:12px;padding:20px;width:360px;max-width:86vw;box-shadow:0 8px 40px rgba(0,0,0,.2)}
.rd-confirm h4{margin:0 0 10px;font-size:15px;display:flex;align-items:center;gap:6px}
.rd-confirm p{margin:0 0 16px;font-size:13px;color:#888;line-height:1.6}
.rd-confirm-btns{display:flex;gap:10px;justify-content:flex-end}
.rd-btn{padding:6px 16px;border-radius:6px;font-size:13px;cursor:pointer;border:none;background:#2979FF;color:#fff}
.rd-btn:hover{background:#1c6ae0}
.rd-btn-outline{padding:6px 16px;border-radius:6px;font-size:13px;cursor:pointer;border:1px solid #d9d9d9;background:#fff;color:#555}
.rd-btn-outline:hover{border-color:#2979FF;color:#2979FF}
</style>
