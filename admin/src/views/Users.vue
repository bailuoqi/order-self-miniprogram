<template>
<div>
<div class="page-hd"><h2>客户管理</h2></div>
<div class="card">
  <div class="toolbar">
    <div class="search-box">
      <i class="ri-search-line"></i>
      <input v-model.trim="keyword" class="search-input" placeholder="搜索昵称 / 手机号" />
      <i v-if="keyword" class="ri-close-circle-fill clear" @click="keyword=''"></i>
    </div>
    <span class="toolbar-meta">共 {{filtered.length}} 位客户<template v-if="keyword">（从 {{list.length}} 位中筛选）</template></span>
  </div>
  <table v-if="paged.length" class="table">
    <thead><tr>
      <th style="width:80px">ID</th><th>昵称</th><th>手机号</th>
      <th class="th-sort" style="width:180px" title="点击切换升序 / 降序" @click="sortDesc=!sortDesc">
        注册时间 <i :class="sortDesc?'ri-sort-desc':'ri-sort-asc'"></i>
      </th>
    </tr></thead>
    <tbody><tr v-for="u in paged" :key="u.id">
      <td>{{u.id}}</td>
      <td><span class="u-cell">
        <img v-if="u.avatar" :src="u.avatar" class="avatar" alt="" />
        <span v-else class="avatar avatar-ph"><i class="ri-user-3-line"></i></span>
        {{u.nickname||'-'}}
      </span></td>
      <td>{{u.phone||'-'}}</td>
      <td>{{u.created_at?.slice(0,16)||'-'}}</td>
    </tr></tbody>
  </table>
  <div v-else class="empty">
    <template v-if="!loaded"><i class="ri-loader-4-line"></i>加载中…</template>
    <template v-else-if="keyword">
      <i class="ri-user-search-line"></i>
      没有匹配「{{keyword}}」的客户
      <p class="empty-sub">试试更换关键词，或清空搜索查看全部客户。</p>
      <button class="btn btn-outline btn-sm" style="margin-top:14px" @click="keyword=''">清空搜索</button>
    </template>
    <template v-else>
      <i class="ri-user-3-line"></i>
      暂无客户
      <p class="empty-sub">客户通过小程序 / H5 注册后会自动出现在这里。</p>
    </template>
  </div>
  <div v-if="totalPages>1" class="pagination">
    <button :disabled="page===1" @click="page--">上一页</button>
    <button v-for="p in totalPages" :key="p" :class="{active:p===page}" @click="page=p">{{p}}</button>
    <button :disabled="page===totalPages" @click="page++">下一页</button>
  </div>
  <p v-if="totalPages>1" class="page-meta">第 {{page}} / {{totalPages}} 页 · 每页 {{PAGE_SIZE}} 条</p>
</div>
</div>
</template>
<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/api'

const PAGE_SIZE = 20
const list = ref([])
const loaded = ref(false)
const keyword = ref('')
const sortDesc = ref(true)
const page = ref(1)

onMounted(async () => {
  try {
    const r = await api.get('/users', { params: { pageSize: 200 } })
    list.value = r.list || []
  } catch (e) {} finally { loaded.value = true }
})

const filtered = computed(() => {
  const kw = keyword.value.toLowerCase()
  if (!kw) return list.value
  return list.value.filter(u =>
    String(u.nickname || '').toLowerCase().includes(kw) ||
    String(u.phone || '').includes(kw))
})
const ts = v => {
  if (!v) return 0
  const t = new Date(String(v).replace(' ', 'T')).getTime()
  return isNaN(t) ? 0 : t
}
const sorted = computed(() => [...filtered.value].sort((a, b) =>
  sortDesc.value ? ts(b.created_at) - ts(a.created_at) : ts(a.created_at) - ts(b.created_at)))
const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / PAGE_SIZE)))
const paged = computed(() => sorted.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))

watch([keyword, sortDesc], () => { page.value = 1 })
watch(totalPages, n => { if (page.value > n) page.value = n })
</script>
<style scoped>
.toolbar{display:flex;align-items:center;gap:16px;margin-bottom:16px}
.search-box{position:relative;width:280px}
.search-box>i.ri-search-line{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text3)}
.search-input{width:100%;padding:8px 32px;border:1px solid var(--border);border-radius:6px;font-size:13px;outline:none;transition:border .2s}
.search-input:focus{border-color:var(--primary)}
.search-box .clear{position:absolute;right:8px;top:50%;transform:translateY(-50%);color:var(--text3);cursor:pointer}
.search-box .clear:hover{color:var(--text2)}
.toolbar-meta{font-size:13px;color:var(--text3)}
.th-sort{cursor:pointer;user-select:none;white-space:nowrap}
.th-sort:hover{color:var(--primary)}
.th-sort i{vertical-align:-2px}
.u-cell{display:inline-flex;align-items:center;gap:8px}
.avatar{width:28px;height:28px;border-radius:50%;object-fit:cover;flex:none}
.avatar-ph{display:inline-flex;align-items:center;justify-content:center;background:var(--primary-light);color:var(--primary);font-size:14px}
.empty-sub{font-size:13px;color:var(--text3);margin-top:6px;line-height:1.7}
.pagination button[disabled]{opacity:.45;cursor:not-allowed}
.page-meta{text-align:center;font-size:12px;color:var(--text3);margin-top:8px}
</style>
