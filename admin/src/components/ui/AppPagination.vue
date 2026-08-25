<!--
  AppPagination 通用分页条（S1 基建 / T3）

  接口契约（供二期各流收敛时对齐，一期各流列表页先用自有 scoped 分页条）：
    import AppPagination from '@/components/ui/AppPagination.vue'
    <AppPagination v-model:page="page" :total="total" :page-size="pageSize" />

  Props：
    page      Number  当前页（1 起），支持 v-model:page
    total     Number  总条数
    pageSize  Number  每页条数，默认 20
  Emits：
    update:page (newPage) — 仅在页码实际变化时触发

  total 为 0 或只有一页时整条隐藏。
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
  pageSize: { type: Number, default: 20 },
})
const emit = defineEmits(['update:page'])

const pages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

// 最多展示 7 个页码，超出以省略号折叠（始终保留首尾页）
const items = computed(() => {
  const p = props.page, n = pages.value
  if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1)
  const set = new Set([1, n, p - 1, p, p + 1])
  if (p <= 3) [2, 3, 4].forEach(x => set.add(x))
  if (p >= n - 2) [n - 1, n - 2, n - 3].forEach(x => set.add(x))
  const nums = [...set].filter(x => x >= 1 && x <= n).sort((a, b) => a - b)
  const out = []
  nums.forEach((x, i) => {
    if (i > 0 && x - nums[i - 1] > 1) out.push('…')
    out.push(x)
  })
  return out
})

const go = p => {
  if (typeof p !== 'number') return
  const clamped = Math.min(Math.max(1, p), pages.value)
  if (clamped !== props.page) emit('update:page', clamped)
}
</script>

<template>
<div v-if="pages > 1" class="pagination">
  <button :disabled="page <= 1" @click="go(page - 1)"><i class="ri-arrow-left-s-line"></i></button>
  <button v-for="(it, i) in items" :key="i" :class="{ active: it === page }" :disabled="it === '…'" @click="go(it)">{{ it }}</button>
  <button :disabled="page >= pages" @click="go(page + 1)"><i class="ri-arrow-right-s-line"></i></button>
  <span class="app-page-total">共 {{ total }} 条 · 第 {{ page }}/{{ pages }} 页</span>
</div>
</template>

<style scoped>
.pagination button:disabled{cursor:not-allowed;opacity:.5}
.app-page-total{align-self:center;margin-left:8px;font-size:12px;color:var(--text3)}
</style>
