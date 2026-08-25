<template>
<div class="login-page">
<div class="card login-card">
  <h2 class="login-title">
    <i class="ri-code-box-line" style="color:var(--primary)"></i> 定制接单 · 团队后台
  </h2>
  <form @submit.prevent="doLogin">
    <div class="form-group">
      <label class="form-label">用户名</label>
      <input class="form-input" v-model="username" placeholder="admin" autocomplete="username" />
    </div>
    <div class="form-group">
      <label class="form-label">密码</label>
      <div class="pwd-wrap">
        <input class="form-input" :type="showPwd ? 'text' : 'password'" v-model="password" placeholder="admin123" autocomplete="current-password" />
        <button type="button" class="pwd-toggle" :title="showPwd ? '隐藏密码' : '显示密码'" @click="showPwd = !showPwd">
          <i :class="showPwd ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
        </button>
      </div>
    </div>
    <div v-if="error" :key="errorKey" class="login-error">
      <i class="ri-error-warning-line"></i> {{ error }}
    </div>
    <button type="submit" class="btn btn-primary login-submit" :disabled="loading">
      {{ loading ? '登录中...' : '登录' }}
    </button>
  </form>
  <p class="login-hint">默认账号: admin / admin123</p>
</div>
</div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/store/admin'
const router = useRouter()
const store = useAdminStore()
const username = ref('admin')
const password = ref('admin123')
const showPwd = ref(false)
const loading = ref(false)
const error = ref('')
const errorKey = ref(0)
const doLogin = async () => {
  if (loading.value) return
  error.value = ''
  loading.value = true
  try { await store.login(username.value, password.value); router.push('/') }
  catch (e) {
    error.value = e.errMsg || e.message || '登录失败'
    errorKey.value++ // 变更 key 重放抖动动画
  }
  finally { loading.value = false }
}
</script>

<style scoped>
.login-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea,#764ba2)}
.login-card{width:400px;padding:40px}
.login-title{text-align:center;margin-bottom:30px;font-size:24px}
.pwd-wrap{position:relative}
.pwd-wrap .form-input{padding-right:42px}
.pwd-toggle{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:none;background:none;cursor:pointer;padding:6px;font-size:16px;color:var(--text3);line-height:1;display:flex}
.pwd-toggle:hover{color:var(--primary)}
.login-error{color:var(--danger);margin-bottom:12px;font-size:13px;display:flex;align-items:center;gap:4px;animation:login-shake .4s}
.login-submit{width:100%;justify-content:center;padding:12px}
.login-hint{text-align:center;margin-top:16px;color:var(--text3);font-size:12px}
@keyframes login-shake{
  0%,100%{transform:translateX(0)}
  20%{transform:translateX(-6px)}
  40%{transform:translateX(6px)}
  60%{transform:translateX(-4px)}
  80%{transform:translateX(4px)}
}
</style>
