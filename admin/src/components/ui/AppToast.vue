<!--
  AppToast 全局轻提示（S1 基建 / T3）

  接口契约（供二期各流收敛时对齐，一期仅 S1 自有文件调用）：
    import { toast } from '@/components/ui/AppToast.vue'
    toast(message)                       // 默认 info，2500ms 自动消失
    toast(message, type)                 // type: 'info' | 'success' | 'error' | 'warning'
    toast(message, type, duration)      // duration: 毫秒，<=0 时不自动消失（点击可关闭）

  挂载约定：<AppToast /> 已在 Layout.vue 挂载一次（Login 等 Layout 外页面如需使用需自行挂载）。
  多条提示自动堆叠，顶部居中显示，不阻断操作。
-->
<script>
import { reactive } from 'vue'

const toasts = reactive([])
let seed = 0

export function toast(message, type = 'info', duration = 2500) {
  const id = ++seed
  toasts.push({ id, message, type })
  if (duration > 0) setTimeout(() => dismiss(id), duration)
  return id
}

function dismiss(id) {
  const i = toasts.findIndex(t => t.id === id)
  if (i > -1) toasts.splice(i, 1)
}

const TYPE_ICON = {
  info: 'ri-information-line',
  success: 'ri-checkbox-circle-line',
  error: 'ri-close-circle-line',
  warning: 'ri-error-warning-line',
}
</script>

<script setup>
const list = toasts
const remove = dismiss
const iconOf = t => TYPE_ICON[t.type] || TYPE_ICON.info
</script>

<template>
<Teleport to="body">
  <transition-group name="app-toast" tag="div" class="app-toast-wrap">
    <div v-for="t in list" :key="t.id" class="app-toast" :class="'app-toast-' + t.type" @click="remove(t.id)">
      <i :class="iconOf(t)"></i>
      <span>{{ t.message }}</span>
    </div>
  </transition-group>
</Teleport>
</template>

<style scoped>
.app-toast-wrap{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:3000;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none}
.app-toast{pointer-events:auto;display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:8px;background:#fff;box-shadow:0 6px 24px rgba(0,0,0,.12);font-size:14px;color:var(--text);cursor:pointer;max-width:60vw}
.app-toast i{font-size:18px}
.app-toast-info i{color:var(--primary)}
.app-toast-success i{color:var(--success)}
.app-toast-error i{color:var(--danger)}
.app-toast-warning i{color:var(--warning)}
.app-toast-enter-active,.app-toast-leave-active{transition:all .25s ease}
.app-toast-enter-from{opacity:0;transform:translateY(-12px)}
.app-toast-leave-to{opacity:0;transform:translateY(-8px)}
</style>
