<template>
<div><div class="page-hd"><h2>团队成员</h2><button class="btn btn-primary btn-sm" @click="openEdit()"><i class="ri-add-line"></i> 添加成员</button></div>
<div class="card">
  <table class="table"><thead><tr><th>用户名</th><th>显示名</th><th>角色</th><th>状态</th><th>最后登录</th><th>操作</th></tr></thead>
    <tbody><tr v-for="a in list" :key="a.id">
      <td>{{a.username}}</td>
      <td>{{a.display_name}}</td>
      <td><span class="tag tag-blue">{{roleLabel(a.role)}}</span></td>
      <td><span :class="'tag '+(a.status===1||a.status==='active'?'tag-green':'tag-red')">{{(a.status===1||a.status==='active')?'启用':'停用'}}</span></td>
      <td>{{a.last_login_at?.slice(0,16)||'-'}}</td>
      <td>
        <button class="btn btn-outline btn-sm" @click="openEdit(a)">编辑</button>
        <button v-if="a.role!=='super'" class="btn btn-danger btn-sm" style="margin-left:4px" @click="remove(a)">删除</button>
      </td>
    </tr></tbody>
  </table>
</div>

<!-- 编辑弹窗 -->
<div v-if="showEdit" style="position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:100" @click.self="showEdit=false">
  <div class="card" style="width:420px">
    <h3 style="margin-bottom:16px">{{form.id?'编辑成员':'添加成员'}}</h3>
    <div style="display:flex;flex-direction:column;gap:12px">
      <label class="fld">用户名<input v-model="form.username" class="input" :disabled="!!form.id" placeholder="登录用户名" /></label>
      <label class="fld">显示名<input v-model="form.display_name" class="input" placeholder="如：张三" /></label>
      <label class="fld">角色
        <select v-model="form.role" class="input">
          <option v-for="(l,k) in roles" :key="k" :value="k">{{l}}</option>
        </select>
      </label>
      <label class="fld">{{form.id?'重置密码（留空不改）':'初始密码'}}<input v-model="form.password" type="password" class="input" placeholder="至少6位" /></label>
      <label class="fld" v-if="form.id">状态
        <select v-model="form.status" class="input">
          <option :value="1">启用</option>
          <option :value="0">停用</option>
        </select>
      </label>
    </div>
    <div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end">
      <button class="btn btn-outline" @click="showEdit=false">取消</button>
      <button class="btn btn-primary" @click="save">保存</button>
    </div>
  </div>
</div>
</div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
const list=ref([])
const showEdit=ref(false)
const form=ref({})
const roles={super:'超级管理员',admin:'管理员',sales:'商务报价',maker:'制作',finance:'财务',editor:'内容编辑'}
const roleLabel=r=>roles[r]||r
const load=async()=>{try{list.value=await api.get('/admins')}catch(e){}}
onMounted(load)
const openEdit=(a)=>{
  form.value=a?{id:a.id,username:a.username,display_name:a.display_name,role:a.role,status:a.status??1,password:''}:{username:'',display_name:'',role:'maker',password:''}
  showEdit.value=true
}
const save=async()=>{
  const f=form.value
  if(!f.username?.trim())return alert('请填写用户名')
  if(!f.id&&(!f.password||f.password.length<6))return alert('初始密码至少6位')
  try{
    const body={display_name:f.display_name,role:f.role}
    if(f.password)body.password=f.password
    if(f.id!==undefined&&f.id){
      body.status=f.status
      await api.put('/admins/'+f.id,body)
    }else{
      body.username=f.username.trim()
      await api.post('/admins',body)
    }
    showEdit.value=false
    await load()
  }catch(e){alert(e.message||'保存失败')}
}
const remove=async(a)=>{
  if(!confirm(`确定删除成员「${a.display_name||a.username}」？`))return
  try{await api.delete('/admins/'+a.id);await load()}catch(e){alert(e.message||'删除失败')}
}
</script>
<style scoped>
.fld{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--text3)}
</style>
