<!--
  AppConfirm 全局确认弹窗（S1 基建 / T3，二期 C4/X1 收敛：全站确认与「理由必填」弹窗统一走本组件）

  接口契约：
    import { appConfirm } from '@/components/ui/AppConfirm.vue'
    const r = await appConfirm({
      title: '提示',            // 可选，默认 '提示'
      message: '确定执行该操作吗？', // 必填，支持 \n 多行（pre-wrap 展示）
      confirmText: '确定',      // 可选
      cancelText: '取消',       // 可选
      danger: false,            // 可选，true 时确认按钮为红色（等价 variant:'danger'）
      variant: 'primary',       // 可选：'primary' | 'danger' | 'success'，控制确认按钮配色
      input: {                  // 可选：附带输入框（取消原因 / 审核备注等理由类弹窗）
        label: '原因（必填）',    //   输入框上方标签
        placeholder: '',        //   占位文案
        required: false,        //   true 时空值（trim 后）不允许确认，内联展示 requiredMessage
        requiredMessage: '请填写内容',
        rows: 3,                //   textarea 行数
        value: '',              //   初始值
      },
      loadingText: '提交中…',    // 可选：onConfirm 执行期间确认按钮文案
      onConfirm: async (value) => {}, // 可选：确认时执行（value 为 trim 后的输入值，无 input 时为 undefined）；
                                      // 抛错则弹窗保持打开并内联展示 e.message，可修改后重试
    })
    // 返回 Promise：
    //   无 input：确认 true / 取消或关闭 false（与一期契约兼容）
    //   有 input：确认 { value }（trim 后）/ 取消或关闭 false
    //   有 onConfirm：onConfirm 成功后才 resolve 确认值

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
  variant: 'primary',
  input: null,
  inputValue: '',
  error: '',
  submitting: false,
  loadingText: '提交中…',
  onConfirm: null,
  resolve: null,
})

export function appConfirm({
  title = '提示', message = '', confirmText = '确定', cancelText = '取消',
  danger = false, variant = '', input = null, loadingText = '提交中…', onConfirm = null,
} = {}) {
  // 上一个弹窗尚未关闭时，视作取消，避免悬空 Promise
  if (state.resolve) state.resolve(false)
  Object.assign(state, {
    visible: true, title, message, confirmText, cancelText,
    variant: variant || (danger ? 'danger' : 'primary'),
    input: input ? { label: '', placeholder: '', required: false, requiredMessage: '请填写内容', rows: 3, value: '', ...input } : null,
    inputValue: input?.value || '',
    error: '', submitting: false, loadingText, onConfirm,
  })
  return new Promise(resolve => { state.resolve = resolve })
}
</script>

<script setup>
import { computed } from 'vue'

const s = state
const btnClass = computed(() => ({ primary: 'btn-primary', danger: 'btn-danger', success: 'btn-success' }[s.variant] || 'btn-primary'))

const close = result => {
  if (s.submitting) return // 提交中禁止取消/关闭，避免结果不确定
  s.visible = false
  if (s.resolve) { s.resolve(result); s.resolve = null }
}
const handleConfirm = async () => {
  if (s.submitting) return
  const value = s.input ? s.inputValue.trim() : undefined
  if (s.input?.required && !value) { s.error = s.input.requiredMessage; return }
  s.error = ''
  if (s.onConfirm) {
    s.submitting = true
    try { await s.onConfirm(value) }
    catch (e) { s.error = e?.message || '操作失败，请重试'; s.submitting = false; return }
    s.submitting = false
  }
  close(s.input ? { value } : true)
}
</script>

<template>
<Teleport to="body">
  <div v-if="s.visible" class="modal-mask" style="z-index:2000" @click.self="close(false)">
    <div class="modal-box" :style="{ minWidth: s.input ? '440px' : '360px', maxWidth: '520px' }">
      <div class="modal-hd">
        <h3>{{ s.title }}</h3>
        <i class="ri-close-line app-confirm-x" @click="close(false)"></i>
      </div>
      <div class="app-confirm-msg">{{ s.message }}</div>
      <div v-if="s.input" class="form-group app-confirm-fld">
        <label v-if="s.input.label" class="form-label">{{ s.input.label }}</label>
        <textarea class="form-input" v-model="s.inputValue" :rows="s.input.rows" :placeholder="s.input.placeholder" :disabled="s.submitting"></textarea>
      </div>
      <p v-if="s.error" class="app-confirm-err"><i class="ri-error-warning-line"></i>{{ s.error }}</p>
      <div class="modal-ft">
        <button class="btn btn-outline" :disabled="s.submitting" @click="close(false)">{{ s.cancelText }}</button>
        <button class="btn" :class="btnClass" :disabled="s.submitting" @click="handleConfirm">{{ s.submitting ? s.loadingText : s.confirmText }}</button>
      </div>
    </div>
  </div>
</Teleport>
</template>

<style scoped>
.app-confirm-x{font-size:20px;color:var(--text3);cursor:pointer}
.app-confirm-x:hover{color:var(--text)}
.app-confirm-msg{color:var(--text2);font-size:14px;line-height:1.7;white-space:pre-wrap}
.app-confirm-fld{margin:14px 0 0}
.app-confirm-err{display:flex;align-items:center;gap:4px;color:var(--danger);font-size:12px;margin-top:8px}
</style>
