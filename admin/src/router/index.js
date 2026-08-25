import { createRouter, createWebHistory } from 'vue-router'

// 角色等级需覆盖后端 AdminRole: super / admin / sales / maker / finance / editor
// 供 Layout 侧栏按角色过滤条目复用（S1/T2）
export const ROLE_LEVEL = { super: 4, super_admin: 4, admin: 3, finance: 2, sales: 1, maker: 1, editor: 1 }

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { noAuth: true, title: '登录' },
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '工作台', role: 'editor' } },
      { path: 'categories', name: 'Categories', component: () => import('@/views/Categories.vue'), meta: { title: '服务分类', role: 'editor' } },
      { path: 'products', name: 'Products', component: () => import('@/views/Products.vue'), meta: { title: '标准服务', role: 'editor' } },
      { path: 'products/edit/:id?', name: 'ProductEdit', component: () => import('@/views/ProductEdit.vue'), meta: { title: '服务编辑', role: 'editor' } },
      { path: 'orders', name: 'Orders', component: () => import('@/views/Orders.vue'), meta: { title: '订单中心', role: 'editor' } },
      { path: 'orders/:id', name: 'OrderDetail', component: () => import('@/views/OrderDetail.vue'), meta: { title: '订单详情', role: 'editor' } },
      { path: 'messages', name: 'Messages', component: () => import('@/views/Messages.vue'), meta: { title: '消息中心', role: 'editor' } },
      { path: 'recruits', name: 'Recruits', component: () => import('@/views/Recruits.vue'), meta: { title: '纳新申请', role: 'editor' } },
      { path: 'refunds', name: 'Refunds', component: () => import('@/views/Refunds.vue'), meta: { title: '退款处理', role: 'editor' } },
      { path: 'users', name: 'Users', component: () => import('@/views/Users.vue'), meta: { title: '客户管理', role: 'editor' } },
      { path: 'page-builder', name: 'PageBuilder', component: () => import('@/views/PageBuilder.vue'), meta: { title: '页面装修', role: 'editor', editorShell: true } },
      { path: 'cms', name: 'Cms', component: () => import('@/views/Cms.vue'), meta: { title: '公告内容', role: 'editor' } },
      { path: 'cms/edit/:id?', name: 'CmsEdit', component: () => import('@/views/CmsEdit.vue'), meta: { title: '内容编辑', role: 'editor' } },
      { path: 'admins', name: 'Admins', component: () => import('@/views/Admins.vue'), meta: { title: '团队成员', role: 'admin' } },
      { path: 'settings', name: 'Settings', component: () => import('@/views/Settings.vue'), meta: { title: '系统配置', role: 'admin' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  const info = JSON.parse(localStorage.getItem('admin_info') || '{}')

  // 未登录
  if (!to.meta.noAuth && !token) return next('/login')
  // 已登录访问登录页
  if (to.meta.noAuth && token) return next('/dashboard')

  // 角色权限检查
  const requiredRole = to.meta.role || 'editor'
  const userRole = info.role || 'editor'
  if ((ROLE_LEVEL[userRole] || 0) < (ROLE_LEVEL[requiredRole] || 0)) {
    console.warn('权限不足, 需 ' + requiredRole)
    return next('/dashboard')
  }

  next()
})

router.afterEach(to => {
  document.title = to.meta.title ? `${to.meta.title} - 定制接单团队后台` : '定制接单 - 团队后台'
})

export default router
