<template>
<div class="ip-root">
  <button type="button" class="ip-trigger" @click="open=!open">
    <i :class="displayIcon" class="ip-cur"></i>
    <span class="ip-val">{{ modelValue || '选择图标' }}</span>
    <span v-if="offList" class="ip-warn" title="该图标不在客户端白名单，客户端将回退显示 ri-apps-2-line">
      <i class="ri-error-warning-line"></i> 白名单外
    </span>
    <i :class="open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'" class="ip-caret"></i>
  </button>
  <div v-if="open" class="ip-pop">
    <div class="ip-grid">
      <button v-for="ic in CLIENT_ICONS" :key="ic" type="button"
        :class="['ip-cell', { on: ic === modelValue }]" :title="ic" @click="pick(ic)">
        <i :class="ic"></i>
      </button>
    </div>
    <div class="ip-foot">共 {{ CLIENT_ICONS.length }} 个客户端白名单图标；白名单外图标客户端回退为 <i class="ri-apps-2-line"></i></div>
  </div>
</div>
</template>

<script setup>
// 图标白名单选择器：只允许选客户端可显示的图标（client-icons.js 常量副本，权威清单见方案 §5.4）；
// 存量配置里白名单外的值显示警告标，不强改数据。
import { ref, computed, watch } from 'vue'
import { CLIENT_ICONS, CLIENT_ICON_FALLBACK, isClientIcon } from './client-icons'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue', 'change'])

const open = ref(false)
const offList = computed(() => !!props.modelValue && !isClientIcon(props.modelValue))
const displayIcon = computed(() => props.modelValue || CLIENT_ICON_FALLBACK)

function pick(ic) {
  emit('update:modelValue', ic)
  emit('change')
  open.value = false
}

watch(() => props.modelValue, () => { open.value = false })
</script>

<style scoped>
.ip-root{flex:1;min-width:0;position:relative}
.ip-trigger{display:flex;align-items:center;gap:6px;width:100%;padding:5px 8px;border:1px solid #d9d9d9;border-radius:4px;background:#fff;cursor:pointer;font-size:12px;color:#333;text-align:left}
.ip-trigger:hover{border-color:#2979FF}
.ip-cur{font-size:15px;color:#2979FF;flex-shrink:0}
.ip-val{flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:#666}
.ip-warn{display:inline-flex;align-items:center;gap:2px;color:#d46b08;background:#fff7e6;border:1px solid #ffd591;border-radius:8px;padding:0 5px;font-size:10px;flex-shrink:0;line-height:1.6}
.ip-caret{color:#bbb;flex-shrink:0}
.ip-pop{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:30;background:#fff;border:1px solid #e0e0e0;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.12);padding:8px}
.ip-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;max-height:180px;overflow-y:auto}
.ip-cell{border:1px solid transparent;background:none;border-radius:6px;padding:6px 0;font-size:16px;color:#555;cursor:pointer;display:flex;align-items:center;justify-content:center}
.ip-cell:hover{background:#f5f8ff;border-color:#a9c8ff;color:#2979FF}
.ip-cell.on{background:#2979FF;color:#fff;border-color:#2979FF}
.ip-foot{margin-top:6px;padding-top:6px;border-top:1px solid #f0f0f0;font-size:10px;color:#bbb;line-height:1.5}
</style>
