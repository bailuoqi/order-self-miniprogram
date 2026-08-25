import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res.data,
  err => {
    // 登录接口本身的 401（密码错误）不触发跳转，让登录页展示错误提示；
    // 已在登录页时也不再整页刷新，避免报错信息被冲掉
    const isLoginCall = err.config?.url?.includes('/auth/admin-login')
    if (err.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_info')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(err.response?.data || err)
  }
)

export default api