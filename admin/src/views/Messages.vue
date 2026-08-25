<template>
<div>
<div class="page-hd">
  <h2>消息中心</h2>
  <div class="actions">
    <span class="refresh-meta"><template v-if="lastRefreshText">最近刷新 {{lastRefreshText}} · </template>每 30 秒自动刷新</span>
    <button class="btn btn-outline btn-sm" :disabled="loading" @click="load(true)">
      <i class="ri-refresh-line" :class="{spin:loading}"></i>{{loading?'刷新中…':'手动刷新'}}
    </button>
  </div>
</div>
<div class="card">
  <div v-if="sorted.length" class="list-meta">
    共 {{sorted.length}} 个会话<template v-if="unreadCount"> · <span class="unread-cnt"><i class="ri-notification-3-fill"></i>{{unreadCount}} 个未读会话已置顶</span></template>
  </div>
  <table v-if="sorted.length" class="table">
    <thead><tr><th>订单</th><th>客户</th><th>最新消息</th><th style="width:130px">时间</th><th style="width:70px">未读</th><th style="width:96px">操作</th></tr></thead>
    <tbody><tr v-for="s in sorted" :key="s.id" :class="{'row-unread':s.team_unread>0}" class="row-click" @click="$router.push('/orders/'+s.order_id)">
      <td class="cell-ellipsis" style="max-width:240px">{{s.order?.title||('订单 #'+s.order_id)}}</td>
      <td>{{s.order?.user?.nickname||'-'}}</td>
      <td class="cell-ellipsis" style="max-width:280px" :class="{'txt-unread':s.team_unread>0}">{{s.last_message||'-'}}</td>
      <td :title="s.last_message_at?.slice(0,19)||''">{{relTime(s.last_message_at)}}</td>
      <td><span v-if="s.team_unread" class="tag tag-red">{{s.team_unread}}</span><span v-else style="color:var(--text3)">0</span></td>
      <td><button class="btn btn-primary btn-sm" @click.stop="$router.push('/orders/'+s.order_id)">去处理</button></td>
    </tr></tbody>
  </table>
  <div v-else class="empty">
    <i class="ri-chat-3-line"></i>
    <template v-if="loaded">
      暂无会话
      <p class="empty-sub">客户在订单中发起沟通后，会话会自动出现在这里；你也可以进入订单详情主动给客户留言。</p>
      <button class="btn btn-primary btn-sm" style="margin-top:14px" @click="$router.push('/orders')"><i class="ri-file-list-3-line"></i>去订单中心</button>
    </template>
    <template v-else>加载中…</template>
  </div>
</div>
</div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/api'

const sessions = ref([])
const loading = ref(false)
const loaded = ref(false)
const lastRefreshText = ref('')
let timer = null

const load = async (manual = false) => {
  if (manual) loading.value = true
  try {
    const r = await api.get('/chat/admin/sessions')
    sessions.value = Array.isArray(r) ? r : []
    lastRefreshText.value = new Date().toTimeString().slice(0, 8)
  } catch (e) {} finally {
    loading.value = false
    loaded.value = true
  }
}
onMounted(() => {
  load(true)
  timer = setInterval(() => load(false), 30000)
})
onUnmounted(() => { if (timer) { clearInterval(timer); timer = null } })

const ts = v => {
  if (!v) return 0
  const t = new Date(String(v).replace(' ', 'T')).getTime()
  return isNaN(t) ? 0 : t
}
// 未读会话置顶，其余按最新消息时间倒序
const sorted = computed(() => [...sessions.value].sort((a, b) => {
  const ua = a.team_unread > 0 ? 1 : 0, ub = b.team_unread > 0 ? 1 : 0
  if (ua !== ub) return ub - ua
  return ts(b.last_message_at) - ts(a.last_message_at)
}))
const unreadCount = computed(() => sessions.value.filter(s => s.team_unread > 0).length)

const relTime = v => {
  if (!v) return '-'
  const t = ts(v)
  if (!t) return String(v).slice(0, 16)
  const diff = Date.now() - t
  if (diff < 60e3) return '刚刚'
  if (diff < 3600e3) return Math.floor(diff / 60e3) + ' 分钟前'
  if (diff < 86400e3) return Math.floor(diff / 3600e3) + ' 小时前'
  if (diff < 7 * 86400e3) return Math.floor(diff / 86400e3) + ' 天前'
  return String(v).slice(5, 16)
}
</script>
<style scoped>
.refresh-meta{font-size:12px;color:var(--text3)}
.spin{display:inline-block;animation:msg-spin 1s linear infinite}
@keyframes msg-spin{to{transform:rotate(360deg)}}
.list-meta{font-size:13px;color:var(--text2);margin-bottom:12px}
.unread-cnt{color:var(--warning);font-weight:600;display:inline-flex;align-items:center;gap:4px}
.cell-ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.row-click{cursor:pointer}
.table tbody tr.row-unread{background:#FFF7E6}
.table tbody tr.row-unread:hover{background:#FFF1D6}
.txt-unread{font-weight:600;color:var(--text)}
.empty-sub{font-size:13px;color:var(--text3);margin-top:6px;line-height:1.7}
</style>
