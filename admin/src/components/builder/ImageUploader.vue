<template>
<div class="iu-root">
  <div v-if="urls.length" class="iu-thumbs">
    <div v-for="(u,i) in urls" :key="u + '_' + i" class="iu-thumb">
      <img :src="u" />
      <button type="button" class="iu-del" title="删除图片" @click="removeAt(i)"><i class="ri-close-line"></i></button>
    </div>
  </div>
  <button type="button" class="iu-btn" :disabled="uploading" @click="pick">
    <i :class="uploading ? 'ri-loader-4-line iu-spin' : 'ri-upload-2-line'"></i>
    {{ uploading ? '上传中…' : btnText }}
  </button>
  <div v-if="error" class="iu-err"><i class="ri-error-warning-line"></i> {{ error }}</div>
  <input ref="fileEl" type="file" accept="image/*" :multiple="multiple" class="iu-file" @change="onFiles" />
</div>
</template>

<script setup>
// 通用图片上传（POST /upload/image，5MB 限制）
// 单图：v-model 为字符串 URL；多图：multiple + v-model 为 URL 数组
import { ref, computed } from 'vue'
import api from '@/api'

const props = defineProps({
  modelValue: { type: [String, Array], default: '' },
  multiple: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'change'])

const fileEl = ref(null)
const uploading = ref(false)
const error = ref('')

const urls = computed(() => {
  if (props.multiple) return Array.isArray(props.modelValue) ? props.modelValue : []
  return props.modelValue ? [props.modelValue] : []
})

const btnText = computed(() => {
  if (props.multiple) return '上传图片（可多选）'
  return urls.value.length ? '重新上传' : '上传图片'
})

function pick() {
  error.value = ''
  if (fileEl.value) fileEl.value.click()
}

async function onFiles(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  if (!files.length) return
  error.value = ''
  uploading.value = true
  const uploaded = []
  try {
    for (const f of files) {
      if (!/^image\//.test(f.type)) throw new Error('「' + f.name + '」不是图片文件')
      if (f.size > 5 * 1024 * 1024) throw new Error('「' + f.name + '」超过 5MB 大小限制')
      const fd = new FormData()
      fd.append('file', f)
      const res = await api.post('/upload/image', fd)
      if (!res || !res.url) throw new Error('上传接口未返回图片地址')
      uploaded.push(res.url)
    }
    if (props.multiple) emit('update:modelValue', [...urls.value, ...uploaded])
    else emit('update:modelValue', uploaded[uploaded.length - 1])
    emit('change')
  } catch (err) {
    error.value = (err && err.message) ? String(err.message) : '上传失败，请重试'
  } finally {
    uploading.value = false
  }
}

function removeAt(i) {
  if (props.multiple) {
    const next = [...urls.value]
    next.splice(i, 1)
    emit('update:modelValue', next)
  } else {
    emit('update:modelValue', '')
  }
  emit('change')
}
</script>

<style scoped>
.iu-root{width:100%}
.iu-thumbs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}
.iu-thumb{position:relative;width:64px;height:64px;border-radius:6px;overflow:hidden;border:1px solid #eee;background:#fafafa}
.iu-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.iu-del{position:absolute;top:2px;right:2px;width:18px;height:18px;border:none;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;padding:0}
.iu-del:hover{background:#ff4d4f}
.iu-btn{width:100%;padding:7px;border:1px dashed #d9d9d9;background:#fff;border-radius:6px;color:#2979FF;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px}
.iu-btn:hover:not(:disabled){border-color:#2979FF;background:#f5f8ff}
.iu-btn:disabled{opacity:.6;cursor:not-allowed}
.iu-err{margin-top:6px;font-size:11px;color:#ff4d4f;display:flex;align-items:flex-start;gap:4px;line-height:1.5}
.iu-file{display:none}
.iu-spin{animation:iu-spin .8s linear infinite}
@keyframes iu-spin{to{transform:rotate(360deg)}}
</style>
