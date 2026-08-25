<template>
<div class="ll-root">
  <div v-if="!components.length" class="ll-empty">
    <i class="ri-stack-line"></i>
    <p>画布还没有组件</p>
    <p class="ll-sub">从左侧组件库拖入画布开始搭建</p>
  </div>
  <div v-else class="ll-list">
    <div v-for="(c,i) in components" :key="c._id"
      :class="['ll-item', { on: i === selectedIdx, 'di-before': dropIdx === i && dropPos === 'before', 'di-after': dropIdx === i && dropPos === 'after' }]"
      draggable="true"
      @dragstart="onStart($event, i)"
      @dragover.prevent="onOver($event, i)"
      @drop.prevent="onDrop($event, i)"
      @dragend="clear"
      @click="$emit('select', i)"
      @mouseenter="$emit('hover', i)"
      @mouseleave="$emit('hover', -1)">
      <i class="ll-handle ri-menu-line" title="拖拽调整顺序"></i>
      <i :class="['ll-icon', (meta[c.type] && meta[c.type].icon) || 'ri-shape-line']"></i>
      <span class="ll-name">{{ (meta[c.type] && meta[c.type].label) || c.type }}</span>
      <span class="ll-order">{{ i + 1 }}</span>
    </div>
  </div>
</div>
</template>

<script setup>
// 图层列表：显示画布组件顺序，点击选中、拖拽调序、hover 联动画布高亮
import { ref } from 'vue'

defineProps({
  components: { type: Array, default: () => [] },
  selectedIdx: { type: Number, default: -1 },
  meta: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['select', 'reorder', 'hover'])

const dropIdx = ref(-1)
const dropPos = ref('')
let fromIdx = -1

function onStart(e, i) {
  fromIdx = i
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', 'layer:' + i)
}

function onOver(e, i) {
  if (fromIdx < 0) return
  const rect = e.currentTarget.getBoundingClientRect()
  dropIdx.value = i
  dropPos.value = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
}

function onDrop(e, i) {
  if (fromIdx < 0) { clear(); return }
  const insert = dropPos.value === 'before' ? i : i + 1
  const to = fromIdx < insert ? insert - 1 : insert
  if (to !== fromIdx) emit('reorder', { from: fromIdx, to })
  clear()
}

function clear() {
  fromIdx = -1
  dropIdx.value = -1
  dropPos.value = ''
}
</script>

<style scoped>
.ll-root{font-size:12px}
.ll-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;color:#bbb;gap:6px;padding:48px 12px;text-align:center}
.ll-empty i{font-size:32px}
.ll-empty p{margin:0}
.ll-sub{font-size:11px;color:#ccc}
.ll-list{display:flex;flex-direction:column;gap:4px}
.ll-item{position:relative;display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #f0f0f0;border-radius:6px;cursor:pointer;background:#fff;transition:border-color .15s,background .15s;user-select:none}
.ll-item:hover{border-color:#a9c8ff;background:#f9fbff}
.ll-item.on{border-color:#2979FF;background:#f0f6ff}
.ll-handle{color:#ccc;cursor:grab;font-size:14px;flex-shrink:0}
.ll-item:hover .ll-handle{color:#999}
.ll-icon{color:#2979FF;font-size:15px;flex-shrink:0}
.ll-name{flex:1;color:#333;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.ll-order{color:#bbb;font-size:11px;flex-shrink:0}
.ll-item.di-before::before,.ll-item.di-after::after{content:'';position:absolute;left:0;right:0;height:2px;background:#2979FF;border-radius:1px;z-index:2}
.ll-item.di-before::before{top:-3px}
.ll-item.di-after::after{bottom:-3px}
</style>
