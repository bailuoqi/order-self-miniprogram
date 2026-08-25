<template>
<div><div class="page-hd"><h2>{{isEdit?'编辑':'新增'}}商品</h2></div>
<div class="edit-grid">
  <div class="card">
    <h3 class="sec-title"><i class="ri-file-list-2-line"></i> 基本信息</h3>
    <div class="form-group"><label class="form-label">标题 <em class="req">*</em></label><input class="form-input" v-model="form.title" placeholder="服务名称" /></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">分类 <em class="req">*</em></label><select class="form-input" v-model="form.category_id"><option :value="null" disabled>请选择分类</option><option v-for="c in categories" :key="c.id" :value="c.id">{{c.name}}</option></select></div>
      <div class="form-group"><label class="form-label">交付周期</label><input class="form-input" v-model="form.delivery_days" placeholder="3-5天" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">价格(元) <em class="req">*</em></label><input class="form-input" type="number" min="0" step="0.01" v-model="priceYuan" placeholder="0.00" /></div>
      <div class="form-group"><label class="form-label">原价(元)</label><input class="form-input" type="number" min="0" step="0.01" v-model="originalPriceYuan" placeholder="0.00" /></div>
      <div class="form-group"><label class="form-label">库存(-1=无限)</label><input class="form-input" type="number" v-model.number="form.stock" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">排序</label><input class="form-input" type="number" v-model.number="form.sort" /></div>
      <div class="form-group"><label class="form-label">状态</label><select class="form-input" v-model="form.status"><option :value="1">上架</option><option :value="0">下架</option></select></div>
    </div>
  </div>

  <div class="card">
    <h3 class="sec-title"><i class="ri-image-2-line"></i> 图片与描述</h3>
    <div class="form-group">
      <label class="form-label">封面图 <span class="hint">客户端列表/详情页展示，建议 4:3，5MB 以内</span></label>
      <div v-if="form.cover" class="cover-wrap">
        <img :src="form.cover" class="cover-img" alt="封面" />
        <div class="cover-ops">
          <button class="btn btn-outline btn-sm" :disabled="coverUploading" @click="pickCover"><i class="ri-refresh-line"></i> 更换</button>
          <button class="btn btn-outline btn-sm op-danger" @click="form.cover=''"><i class="ri-delete-bin-line"></i> 移除</button>
        </div>
      </div>
      <button v-else class="upload-slot cover-slot" :disabled="coverUploading" @click="pickCover">
        <i :class="coverUploading?'ri-loader-4-line spin':'ri-add-line'"></i>
        <span>{{coverUploading?'上传中...':'上传封面'}}</span>
      </button>
      <input type="file" ref="coverInput" accept="image/*" style="display:none" @change="onCoverChosen" />
    </div>
    <div class="form-group">
      <label class="form-label">图集 <span class="hint">详情页轮播图，可多选，支持调序</span></label>
      <div class="img-grid">
        <div v-for="(img,i) in form.images" :key="img+i" class="img-item">
          <img :src="img" alt="图集图片" />
          <div class="img-ops">
            <i class="ri-arrow-left-s-line" :class="{disabled:i===0}" title="前移" @click="moveImage(i,-1)"></i>
            <i class="ri-arrow-right-s-line" :class="{disabled:i===form.images.length-1}" title="后移" @click="moveImage(i,1)"></i>
            <i class="ri-delete-bin-line" title="删除" @click="form.images.splice(i,1)"></i>
          </div>
        </div>
        <button class="upload-slot img-slot" :disabled="imagesUploading>0" @click="pickImages">
          <i :class="imagesUploading>0?'ri-loader-4-line spin':'ri-add-line'"></i>
          <span>{{imagesUploading>0?`上传中(${imagesUploading})`:'添加图片'}}</span>
        </button>
      </div>
      <input type="file" ref="imagesInput" accept="image/*" multiple style="display:none" @change="onImagesChosen" />
    </div>
    <div class="form-group"><label class="form-label">描述</label><textarea class="form-input" v-model="form.description" rows="5" placeholder="服务内容、交付物、注意事项等"></textarea></div>
  </div>
</div>
<div class="ft-bar"><button class="btn btn-outline" @click="back">取消</button><button class="btn btn-primary" @click="save" :disabled="saving">{{saving?'保存中...':'保存'}}</button></div>

<transition name="toast-fade"><div v-if="toast" class="toast" :class="{'toast-err':toastErr}">{{toast}}</div></transition>
</div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api'
const router=useRouter()
const route=useRoute()
const isEdit=!!route.params.id
const saving=ref(false)
const categories=ref([])
const form=ref({title:'',category_id:null,stock:-1,description:'',delivery_days:'',sort:0,status:1,cover:'',images:[]})
// 价格用字符串受控，避免清空输入时 (''/100).toFixed 产生 NaN（D20）
const priceYuan=ref('')
const originalPriceYuan=ref('')

const toast=ref('');const toastErr=ref(false);let toastTimer=null
const showToast=(msg,err=false)=>{toast.value=msg;toastErr.value=err;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.value='',2500)}

onMounted(async()=>{
  try{categories.value=await api.get('/categories')}catch(e){}
  if(isEdit){
    try{
      const p=await api.get('/products/'+route.params.id)
      form.value={
        id:p.id,title:p.title||'',category_id:p.category_id??null,stock:p.stock??-1,
        description:p.description||'',delivery_days:p.delivery_days||'',sort:p.sort||0,
        status:p.status??1,cover:p.cover||'',images:Array.isArray(p.images)?[...p.images]:[]
      }
      priceYuan.value=(p.price/100).toFixed(2)
      originalPriceYuan.value=p.original_price?(p.original_price/100).toFixed(2):''
    }catch(e){showToast(e.message||'加载商品失败',true)}
  }
})

const toCents=(v)=>{const n=parseFloat(v);return Number.isFinite(n)?Math.round(n*100):0}

// ---- 上传（本文件内实现，走 POST /upload/image）----
const coverInput=ref(null)
const imagesInput=ref(null)
const coverUploading=ref(false)
const imagesUploading=ref(0)
const uploadImage=async(file)=>{
  if(file.size>5*1024*1024)throw new Error(`「${file.name}」超过 5MB 限制`)
  const fd=new FormData()
  fd.append('file',file)
  const r=await api.post('/upload/image',fd,{headers:{'Content-Type':'multipart/form-data'}})
  return r.url
}
const pickCover=()=>coverInput.value?.click()
const onCoverChosen=async(e)=>{
  const file=e.target.files?.[0]
  e.target.value=''
  if(!file)return
  coverUploading.value=true
  try{form.value.cover=await uploadImage(file)}
  catch(err){showToast(err.message||'封面上传失败',true)}
  finally{coverUploading.value=false}
}
const pickImages=()=>imagesInput.value?.click()
const onImagesChosen=async(e)=>{
  const files=Array.from(e.target.files||[])
  e.target.value=''
  if(!files.length)return
  imagesUploading.value=files.length
  for(const file of files){
    try{form.value.images.push(await uploadImage(file))}
    catch(err){showToast(err.message||'图片上传失败',true)}
    finally{imagesUploading.value--}
  }
}
const moveImage=(i,dir)=>{
  const j=i+dir
  if(j<0||j>=form.value.images.length)return
  const arr=form.value.images
  ;[arr[i],arr[j]]=[arr[j],arr[i]]
}

const save=async()=>{
  if(!form.value.title.trim())return showToast('请填写标题',true)
  if(!form.value.category_id)return showToast('请选择分类',true)
  const price=toCents(priceYuan.value)
  if(price<=0)return showToast('请填写有效价格',true)
  saving.value=true
  const payload={
    title:form.value.title.trim(),category_id:form.value.category_id,
    price,original_price:toCents(originalPriceYuan.value),
    stock:Number.isFinite(form.value.stock)?form.value.stock:-1,
    description:form.value.description,delivery_days:form.value.delivery_days,
    sort:Number.isFinite(form.value.sort)?form.value.sort:0,status:form.value.status,
    cover:form.value.cover,images:form.value.images
  }
  try{
    if(isEdit) await api.put('/products/'+form.value.id,payload)
    else await api.post('/products',payload)
    router.push('/products')
  }catch(e){showToast(e.message||'保存失败',true)}
  finally{saving.value=false}
}
const back=()=>router.push('/products')
</script>
<style scoped>
.edit-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(460px,1fr));gap:16px;align-items:start;max-width:1200px}
.ft-bar{display:flex;gap:10px;margin-top:20px;max-width:1200px;justify-content:flex-end}
.sec-title{font-size:15px;margin-bottom:16px;display:flex;align-items:center;gap:6px;color:var(--text)}
.sec-title i{color:var(--primary)}
.req{color:var(--danger);font-style:normal}
.hint{font-weight:400;color:var(--text3);font-size:12px;margin-left:6px}
.upload-slot{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border:1px dashed var(--border);border-radius:8px;background:#FAFBFC;color:var(--text3);cursor:pointer;transition:all .2s;font-size:13px}
.upload-slot:hover{border-color:var(--primary);color:var(--primary)}
.upload-slot:disabled{cursor:wait;opacity:.7}
.upload-slot i{font-size:22px}
.cover-slot{width:180px;height:135px}
.cover-wrap{display:flex;align-items:flex-end;gap:12px}
.cover-img{width:180px;height:135px;object-fit:cover;border-radius:8px;border:1px solid var(--border);display:block}
.cover-ops{display:flex;flex-direction:column;gap:8px}
.op-danger:hover{border-color:var(--danger);color:var(--danger)}
.img-grid{display:flex;flex-wrap:wrap;gap:10px}
.img-item{position:relative;width:104px;height:104px;border-radius:8px;overflow:hidden;border:1px solid var(--border)}
.img-item img{width:100%;height:100%;object-fit:cover;display:block}
.img-ops{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-around;align-items:center;background:rgba(0,0,0,.55);color:#fff;padding:4px 0;opacity:0;transition:opacity .15s}
.img-item:hover .img-ops{opacity:1}
.img-ops i{cursor:pointer;font-size:16px}
.img-ops i:hover{color:#8AB4FF}
.img-ops i.disabled{opacity:.35;cursor:not-allowed}
.img-slot{width:104px;height:104px}
.spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.toast{position:fixed;top:24px;left:50%;transform:translateX(-50%);background:rgba(26,26,46,.9);color:#fff;padding:10px 22px;border-radius:8px;font-size:14px;z-index:2000;box-shadow:0 6px 20px rgba(0,0,0,.2)}
.toast-err{background:var(--danger)}
.toast-fade-enter-active,.toast-fade-leave-active{transition:all .25s}
.toast-fade-enter-from,.toast-fade-leave-to{opacity:0;transform:translate(-50%,-8px)}
</style>
