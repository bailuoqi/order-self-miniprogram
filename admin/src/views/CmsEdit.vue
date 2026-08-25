<template>
<div><div class="page-hd"><h2>{{isEdit?'编辑':'新增'}}内容</h2></div>
<div class="cms-grid">
  <div class="card">
    <h3 class="sec-title"><i class="ri-edit-2-line"></i> 内容编辑</h3>
    <div class="form-group"><label class="form-label">标题 <em class="req">*</em></label><input class="form-input" v-model="form.title" /></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">类型</label><select class="form-input" v-model="form.type"><option value="notice">公告</option><option value="help">帮助</option><option value="about">关于</option><option value="banner">轮播</option></select></div>
      <div class="form-group"><label class="form-label">状态</label><select class="form-input" v-model="form.status"><option :value="1">显示</option><option :value="0">隐藏</option></select></div>
    </div>
    <p class="type-note" :class="{warn:form.type==='banner'}"><i :class="form.type==='banner'?'ri-alert-line':'ri-information-line'"></i> {{TYPE_NOTE[form.type]}}</p>
    <div class="form-group"><label class="form-label">内容 (HTML 源码)</label><textarea class="form-input code-area" v-model="form.content" rows="16" spellcheck="false" placeholder="&lt;p&gt;支持 HTML 标签，右侧实时预览&lt;/p&gt;"></textarea></div>
    <div class="form-group"><label class="form-label">摘要</label><input class="form-input" v-model="form.summary" placeholder="列表页展示的简短说明（选填）" /></div>
    <div class="ft-bar"><button class="btn btn-outline" @click="back">取消</button><button class="btn btn-primary" @click="save" :disabled="saving">{{saving?'保存中...':'保存'}}</button></div>
  </div>

  <div class="card preview-card">
    <h3 class="sec-title"><i class="ri-eye-line"></i> 实时预览</h3>
    <div class="preview-shell">
      <h4 class="preview-title">{{form.title||'（未填写标题）'}}</h4>
      <p v-if="form.summary" class="preview-summary">{{form.summary}}</p>
      <div v-if="form.content" class="preview-body" v-html="form.content"></div>
      <p v-else class="preview-empty"><i class="ri-file-text-line"></i>左侧输入 HTML 内容后此处实时预览</p>
    </div>
  </div>
</div>
</div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api'
import { toast } from '@/components/ui/AppToast.vue'
const TYPE_NOTE={
  notice:'公告：用于客户端首页公告条与公告列表。',
  help:'帮助：用于客户端帮助/常见问题内容。',
  about:'关于：用于客户端关于页展示。',
  banner:'轮播：客户端暂未消费该类型，仅作素材存档（二期接通首页展示）。',
}
const router=useRouter();const route=useRoute()
const isEdit=!!route.params.id;const saving=ref(false)
const form=ref({title:'',type:'notice',content:'',summary:'',status:1})

onMounted(async()=>{
  if(isEdit){
    try{const a=await api.get('/cms/articles/'+route.params.id);form.value={...a}}
    catch(e){toast(e.message||'加载内容失败','error')}
  }
})
const save=async()=>{
  if(!form.value.title?.trim())return toast('请填写标题','error')
  if(!form.value.content?.trim())return toast('请填写内容','error')
  saving.value=true
  try{
    if(isEdit) await api.put('/cms/articles/'+form.value.id,form.value)
    else await api.post('/cms/articles',form.value)
    router.push('/cms')
  }catch(e){toast(e.message||'保存失败','error')}
  finally{saving.value=false}
}
const back=()=>router.push('/cms')
</script>
<style scoped>
.cms-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(460px,1fr));gap:16px;align-items:start;max-width:1400px}
.sec-title{font-size:15px;margin-bottom:16px;display:flex;align-items:center;gap:6px;color:var(--text)}
.sec-title i{color:var(--primary)}
.req{color:var(--danger);font-style:normal}
.type-note{display:flex;align-items:center;gap:6px;background:var(--primary-light);color:var(--primary-dark);border-radius:6px;padding:8px 12px;font-size:13px;margin-bottom:16px}
.type-note.warn{background:#FFF7E6;color:#B26A00;border:1px solid #FFE1B3}
.code-area{font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;font-size:13px;line-height:1.6;tab-size:2}
.ft-bar{display:flex;gap:10px;margin-top:20px;justify-content:flex-end}
.preview-card{position:sticky;top:24px}
.preview-shell{border:1px solid var(--border);border-radius:8px;padding:20px;min-height:320px;max-height:calc(100vh - 220px);overflow:auto;background:#FCFCFD}
.preview-title{font-size:17px;margin-bottom:8px}
.preview-summary{color:var(--text3);font-size:13px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px dashed var(--border)}
.preview-body{line-height:1.8;font-size:14px;color:var(--text);word-break:break-word}
.preview-body :deep(img){max-width:100%;border-radius:6px}
.preview-body :deep(p){margin-bottom:.6em}
.preview-body :deep(h1),.preview-body :deep(h2),.preview-body :deep(h3){margin:.8em 0 .4em}
.preview-body :deep(ul),.preview-body :deep(ol){padding-left:1.5em;margin-bottom:.6em}
.preview-body :deep(a){color:var(--primary)}
.preview-empty{text-align:center;color:var(--text3);padding:60px 0;font-size:13px}
.preview-empty i{font-size:36px;display:block;margin-bottom:10px}
</style>
