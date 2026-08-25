<template>
<div class="shell" :class="{ 'shell-collapsed': collapsed }">
  <aside class="shell-aside">
    <div class="shell-brand" :title="collapsed ? '定制接单 · 团队后台' : ''">
      <i class="ri-code-box-line"></i><span v-if="!collapsed" class="brand-text">定制接单 · 团队后台</span>
    </div>
    <nav class="shell-nav">
      <template v-for="group in visibleNav" :key="group.group || 'top'">
        <div v-if="group.group" class="nav-group">
          <span v-if="!collapsed">{{ group.group }}</span>
          <span v-else class="nav-group-divider"></span>
        </div>
        <router-link
          v-for="item in group.items" :key="item.to"
          :to="item.to" class="nav-item" active-class="nav-active"
          :title="collapsed ? item.label : ''">
          <i :class="item.icon"></i><span v-if="!collapsed">{{ item.label }}</span>
        </router-link>
      </template>
    </nav>
    <div class="shell-collapse" :title="collapsed ? '展开侧栏' : '收起侧栏'" @click="toggleCollapse">
      <i :class="collapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'"></i><span v-if="!collapsed">收起侧栏</span>
    </div>
  </aside>

  <div class="shell-main">
    <header class="shell-topbar">
      <div class="topbar-title">{{ pageTitle }}</div>
      <div class="topbar-right">
        <button class="topbar-bell" title="消息中心" @click="router.push('/messages')">
          <i class="ri-notification-3-line"></i>
          <span v-if="unreadTotal > 0" class="bell-badge">{{ unreadTotal > 99 ? '99+' : unreadTotal }}</span>
        </button>
        <div class="topbar-user">
          <span class="user-name">{{ displayName }}</span>
          <span class="tag tag-blue">{{ roleLabel }}</span>
        </div>
        <button class="topbar-logout" title="退出登录" @click="doLogout">
          <i class="ri-logout-box-r-line"></i>
        </button>
      </div>
    </header>
    <main class="shell-content">
      <div class="page-container"><router-view /></div>
    </main>
  </div>

  <AppToast />
  <AppConfirm />
</div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/store/admin'
import { ROLE_LEVEL } from '@/router'
import api from '@/api'
import AppToast from '@/components/ui/AppToast.vue'
import AppConfirm, { appConfirm } from '@/components/ui/AppConfirm.vue'

const route = useRoute()
const router = useRouter()
const store = useAdminStore()

/* ---- 顶栏：页面标题 / 当前登录人 ---- */
const pageTitle = computed(() => route.meta.title || '定制接单 · 团队后台')
const ROLE_LABEL = { super: '超级管理员', super_admin: '超级管理员', admin: '管理员', sales: '商务', maker: '制作', finance: '财务', editor: '内容编辑' }
const displayName = computed(() => store.admin?.display_name || store.admin?.username || '未知用户')
const roleLabel = computed(() => ROLE_LABEL[store.admin?.role] || store.admin?.role || '成员')

/* ---- 顶栏：未读铃铛（30s 轮询聚合 team_unread，接口失败静默隐藏角标） ---- */
const unreadTotal = ref(0)
let bellTimer = null
const fetchUnread = async () => {
  try {
    const sessions = await api.get('/chat/admin/sessions')
    unreadTotal.value = (Array.isArray(sessions) ? sessions : []).reduce((sum, s) => sum + (Number(s.team_unread) || 0), 0)
  } catch (e) {
    unreadTotal.value = 0
  }
}
onMounted(() => {
  fetchUnread()
  bellTimer = setInterval(fetchUnread, 30000)
})
onUnmounted(() => clearInterval(bellTimer))
// 路由切换时顺带刷新（如处理完会话返回后角标及时清零）
watch(() => route.path, fetchUnread)

/* ---- 侧栏：按角色过滤（ROLE_LEVEL 与路由守卫共用同一模型） ---- */
const NAV = [
  { group: '', items: [
    { to: '/dashboard', icon: 'ri-dashboard-line', label: '工作台' },
  ] },
  { group: '接单', items: [
    { to: '/orders', icon: 'ri-file-list-3-line', label: '订单中心' },
    { to: '/messages', icon: 'ri-chat-3-line', label: '消息中心' },
    { to: '/refunds', icon: 'ri-refund-2-line', label: '退款处理' },
  ] },
  { group: '服务与内容', items: [
    { to: '/categories', icon: 'ri-price-tag-3-line', label: '服务分类' },
    { to: '/products', icon: 'ri-shopping-bag-3-line', label: '标准服务' },
    { to: '/page-builder', icon: 'ri-layout-masonry-line', label: '页面装修' },
    { to: '/cms', icon: 'ri-article-line', label: '公告内容' },
  ] },
  { group: '团队', items: [
    { to: '/users', icon: 'ri-user-3-line', label: '客户管理' },
    { to: '/recruits', icon: 'ri-user-add-line', label: '纳新申请' },
    { to: '/admins', icon: 'ri-shield-user-line', label: '团队成员', role: 'admin' },
  ] },
  { group: '系统', items: [
    { to: '/settings', icon: 'ri-settings-3-line', label: '系统配置', role: 'admin' },
  ] },
]
const myLevel = computed(() => ROLE_LEVEL[store.admin?.role || 'editor'] || 0)
const visibleNav = computed(() =>
  NAV.map(g => ({ ...g, items: g.items.filter(it => myLevel.value >= (ROLE_LEVEL[it.role || 'editor'] || 0)) }))
    .filter(g => g.items.length > 0)
)

/* ---- 侧栏折叠（localStorage 记忆） ---- */
const collapsed = ref(localStorage.getItem('admin_sidebar_collapsed') === '1')
const toggleCollapse = () => {
  collapsed.value = !collapsed.value
  localStorage.setItem('admin_sidebar_collapsed', collapsed.value ? '1' : '0')
}

/* ---- 退出登录（顶栏入口 + 确认弹窗） ---- */
const doLogout = async () => {
  const ok = await appConfirm({ title: '退出登录', message: '确定要退出当前账号吗？', confirmText: '退出', danger: true })
  if (!ok) return
  store.logout()
  router.push('/login')
}
</script>

<style scoped>
/* ===== 壳层骨架：侧栏 + 顶栏 + 内容区（最低支持宽度 1280，更窄出横向滚动） ===== */
.shell{display:flex;min-height:100vh;min-width:1280px}
.shell-aside{width:230px;background:#1A1A2E;color:#fff;flex-shrink:0;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;transition:width .2s}
.shell-collapsed .shell-aside{width:64px}
.shell-main{flex:1;min-width:0;display:flex;flex-direction:column}

/* ===== 品牌区 ===== */
.shell-brand{padding:20px;font-size:17px;font-weight:700;border-bottom:1px solid rgba(255,255,255,.08);white-space:nowrap;overflow:hidden;display:flex;align-items:center;gap:8px}
.shell-brand i{color:var(--primary);font-size:20px;flex-shrink:0}
.shell-collapsed .shell-brand{padding:20px 0;justify-content:center}

/* ===== 导航 ===== */
.shell-nav{flex:1;padding:12px 0;overflow-y:auto;overflow-x:hidden}
.nav-item{display:flex;align-items:center;gap:10px;padding:10px 20px;color:rgba(255,255,255,.55);text-decoration:none;font-size:13px;transition:.2s;white-space:nowrap}
.nav-item i{font-size:16px;flex-shrink:0}
.nav-item:hover{color:#fff;background:rgba(255,255,255,.05)}
.nav-active{color:#fff!important;background:rgba(41,121,255,.25);border-right:3px solid #2979FF}
.nav-group{padding:16px 20px 6px;font-size:11px;color:rgba(255,255,255,.25);text-transform:uppercase;letter-spacing:1px}
.nav-group-divider{display:block;border-top:1px solid rgba(255,255,255,.1)}
.shell-collapsed .nav-item{padding:12px 0;justify-content:center}
.shell-collapsed .nav-group{padding:8px 16px}

/* ===== 折叠开关 ===== */
.shell-collapse{padding:14px 20px;border-top:1px solid rgba(255,255,255,.08);cursor:pointer;color:rgba(255,255,255,.55);font-size:13px;display:flex;align-items:center;gap:10px;white-space:nowrap}
.shell-collapse:hover{color:#fff}
.shell-collapsed .shell-collapse{padding:14px 0;justify-content:center}

/* ===== 顶栏（56px） ===== */
.shell-topbar{height:56px;flex-shrink:0;background:#fff;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:50}
.topbar-title{font-size:16px;font-weight:600;color:var(--text)}
.topbar-right{display:flex;align-items:center;gap:16px}
.topbar-bell{position:relative;border:none;background:none;cursor:pointer;font-size:20px;color:var(--text2);padding:6px;border-radius:6px;line-height:1;display:flex}
.topbar-bell:hover{background:var(--bg);color:var(--primary)}
.bell-badge{position:absolute;top:-2px;right:-6px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--danger);color:#fff;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center}
.topbar-user{display:flex;align-items:center;gap:8px}
.user-name{font-size:14px;font-weight:500;color:var(--text)}
.topbar-logout{border:none;background:none;cursor:pointer;font-size:18px;color:var(--text2);padding:6px;border-radius:6px;line-height:1;display:flex}
.topbar-logout:hover{background:#FFEBEE;color:var(--danger)}

/* ===== 内容区：限宽居中（.page-container 定义在全局 style.css） ===== */
.shell-content{flex:1;padding:24px}
</style>
