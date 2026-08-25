<!--
  AppConfirm 全局确认弹窗（S1 基建 / T3），替代原生 confirm()

  接口契约（供二期各流收敛时对齐，一期仅 S1 自有文件调用）：
    import { appConfirm } from '@/components/ui/AppConfirm.vue'
    const ok = await appConfirm({
      title: '提示',            // 可选，默认 '提示'
      message: '确定执行该操作吗？', // 必填
      confirmText: '确定',      // 可选
      cancelText: '取消',       // 可选
      danger: false,            // 可选，true 时确认按钮为红色（危险操作）
    })
    // 返回 Promise<boolean>：确认 true / 取消或关闭 false

  挂载约定：<AppConfirm /> 已在 Layout.vue 挂载一次（Login 等 Layout 外页面如需使用需自行挂载）。
-->
<script>
import { reactive } from 'vue'

const state = reactive({
  visible: false,
  title: '提示',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  danger: false,
  resolve: null,
})

export function appConfirm({ title = '提示', message = '', confirmText = '确定', cancelText = '取消', danger = false } = {}) {
  // 上一个弹窗尚未关闭时，视作取消，避免悬空 Promise
  if (state.resolve) state.resolve(false)
  Object.assign(state, { visible: true, title, message, confirmText, cancelText, danger })
  return new Promise(resolve => { state.resolve = resolve })
}
</script>

<script setup>
const s = state
const close = result => {
  s.visible = false
  if (s.resolve) { s.resolve(result); s.resolve = null }
}
</script>

<template>
<Teleport to="body">
  <div v-if="s.visible" class="modal-mask" style="z-index:2000" @click.self="close(false)">
    <div class="modal-box" style="min-width:360px;max-width:460px">
      <div class="modal-hd">
        <h3>{{ s.title }}</h3>
        <i class="ri-close-line app-confirm-x" @click="close(false)"></i>
      </div>
      <div class="app-confirm-msg">{{ s.message }}</div>
      <div class="modal-ft">
        <button class="btn btn-outline" @click="close(false)">{{ s.cancelText }}</button>
        <button class="btn" :class="s.danger ? 'btn-danger' : 'btn-primary'" @click="close(true)">{{ s.confirmText }}</button>
      </div>
    </div>
  </div>
</Teleport>
</template>

<style scoped>
.app-confirm-x{font-size:20px;color:var(--text3);cursor:pointer}
.app-confirm-x:hover{color:var(--text)}
.app-confirm-msg{color:var(--text2);font-size:14px;line-height:1.7;white-space:pre-wrap}
</style>
