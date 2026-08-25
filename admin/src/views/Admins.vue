<template>
<div><div class="page-hd"><h2>团队成员</h2><button class="btn btn-primary btn-sm" @click="openEdit()"><i class="ri-add-line"></i> 添加成员</button></div>
<div class="card">
  <table v-if="list.length" class="table">
    <thead><tr>
      <th>用户名</th><th>显示名</th>
      <th>角色
        <span class="role-help"><i class="ri-question-line"></i>
          <span class="role-tip">
            <b>角色说明</b>
            <span v-for="(r,k) in roles" :key="k" class="role-tip-row"><i>{{r.label}}</i>{{r.desc}}</span>
          </span>
        </span>
      </th>
      <th>状态</th><th>最后登录</th><th style="width:170px">操作</th>
    </tr></thead>
    <tbody><tr v-for="a in list" :key="a.id">
      <td>{{a.username}}<i v-if="a.role==='super'" class="ri-shield-star-line super-mark" title="系统内置超级管理员账号"></i></td>
      <td>{{a.display_name}}</td>
      <td><span class="tag tag-blue" :title="roles[a.role]?.desc||''">{{roleLabel(a.role)}}</span></td>
      <td><span :class="'tag '+(isActive(a)?'tag-green':'tag-red')">{{isActive(a)?'启用':'停用'}}</span></td>
      <td :title="a.last_login_at?.replace('T',' ').slice(0,19)||''">{{relTime(a.last_login_at)}}</td>
      <td>
        <button class="btn btn-outline btn-sm" @click="openEdit(a)">编辑</button>
        <button v-if="a.role!=='super'" class="btn btn-danger btn-sm" style="margin-left:4px" @click="confirmDel=a">删除</button>
        <span v-else class="protect-hint" title="超级管理员为系统内置账号，不可删除、停用或变更角色"><i class="ri-lock-line"></i>受保护</span>
      </td>
    </tr></tbody>
  </table>
  <div v-else class="empty">
    <i class="ri-team-line"></i>
    暂无团队成员
    <p class="empty-sub">点击右上角「添加成员」创建后台账号，并按分工指定角色。</p>
  </div>
</div>

<!-- 编辑弹窗 -->
<div v-if="showEdit" class="modal-mask" @click.self="showEdit=false">
  <div class="modal-box" style="min-width:440px">
    <div class="modal-hd">
      <h3>{{form.id?'编辑成员':'添加成员'}}</h3>
      <i class="ri-close-line" style="cursor:pointer;font-size:20px" @click="showEdit=false"></i>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <label class="fld">用户名<input v-model="form.username" class="form-input" :disabled="!!form.id" placeholder="登录用户名" /></label>
      <label class="fld">显示名<input v-model="form.display_name" class="form-input" placeholder="如：张三" /></label>
      <label class="fld">角色
        <select v-model="form.role" class="form-input" :disabled="isSuperTarget">
          <option v-for="(r,k) in roleOptions" :key="k" :value="k">{{r.label}}</option>
        </select>
        <span class="fld-hint">{{roles[form.role]?.desc||''}}</span>
      </label>
      <label class="fld">{{form.id?'重置密码（留空不改）':'初始密码'}}<input v-model="form.password" type="password" class="form-input" placeholder="至少6位" /></label>
      <label class="fld" v-if="form.id&&!isSuperTarget">状态
        <select v-model="form.status" class="form-input">
          <option :value="1">启用</option>
          <option :value="0">停用</option>
        </select>
      </label>
      <p v-if="isSuperTarget" class="super-note"><i class="ri-shield-star-line"></i>超级管理员为系统内置账号，不可停用或变更角色，仅可修改显示名与密码。</p>
    </div>
    <p v-if="formError" class="form-err"><i class="ri-error-warning-line"></i>{{formError}}</p>
    <div class="modal-ft">
      <button class="btn btn-outline" :disabled="saving" @click="showEdit=false">取消</button>
      <button class="btn btn-primary" :disabled="saving" @click="save">{{saving?'保存中…':'保存'}}</button>
    </div>
  </div>
</div>

<!-- 删除确认弹窗 -->
<div v-if="confirmDel" class="modal-mask" @click.self="!removing&&(confirmDel=null)">
  <div class="modal-box" style="min-width:400px">
    <div class="modal-hd"><h3>删除成员</h3><i class="ri-close-line" style="cursor:pointer;font-size:20px" @click="confirmDel=null"></i></div>
    <p style="line-height:1.7">确定删除成员「<b>{{confirmDel.display_name||confirmDel.username}}</b>」？<br /><span style="font-size:13px;color:var(--text3)">删除后该账号将无法登录后台，此操作不可恢复。</span></p>
    <p v-if="removeError" class="form-err"><i class="ri-error-warning-line"></i>{{removeError}}</p>
    <div class="modal-ft">
      <button class="btn btn-outline" :disabled="removing" @click="confirmDel=null">取消</button>
      <button class="btn btn-danger" :disabled="removing" @click="remove">{{removing?'删除中…':'确认删除'}}</button>
    </div>
  </div>
</div>
</div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'

const list = ref([])
const showEdit = ref(false)
const form = ref({})
const formError = ref('')
const saving = ref(false)
const confirmDel = ref(null)
const removeError = ref('')
const removing = ref(false)

// 六种角色各自的一句话说明（tooltip / 表单提示共用）
const roles = {
  super:   { label: '超级管理员', desc: '拥有全部权限的系统内置账号，不可删除、停用或变更角色。' },
  admin:   { label: '管理员',     desc: '可管理团队成员与系统配置，处理全部业务功能。' },
  finance: { label: '财务',       desc: '负责收款确认与退款审核等资金相关操作。' },
  sales:   { label: '商务报价',   desc: '负责订单沟通与商务报价，跟进客户需求。' },
  maker:   { label: '制作',       desc: '负责订单制作与交付文件上传。' },
  editor:  { label: '内容编辑',   desc: '负责公告内容与页面装修等内容维护。' },
}
const roleLabel = r => roles[r]?.label || r
const isActive = a => a.status === 1 || a.status === 'active'
// 防误操作：不允许把普通成员提为 super；编辑 super 时锁定为 super
const isSuperTarget = computed(() => form.value.role === 'super' && !!form.value.id)
const roleOptions = computed(() => {
  if (isSuperTarget.value) return { super: roles.super }
  const { super: _s, ...rest } = roles
  return rest
})

const load = async () => { try { list.value = await api.get('/admins') } catch (e) {} }
onMounted(load)

const relTime = v => {
  if (!v) return '从未登录'
  const t = new Date(String(v).replace(' ', 'T')).getTime()
  if (isNaN(t)) return String(v).replace('T', ' ').slice(0, 16)
  const diff = Date.now() - t
  if (diff < 60e3) return '刚刚'
  if (diff < 3600e3) return Math.floor(diff / 60e3) + ' 分钟前'
  if (diff < 86400e3) return Math.floor(diff / 3600e3) + ' 小时前'
  if (diff < 30 * 86400e3) return Math.floor(diff / 86400e3) + ' 天前'
  return String(v).slice(0, 10)
}

const openEdit = a => {
  form.value = a
    ? { id: a.id, username: a.username, display_name: a.display_name, role: a.role, status: isActive(a) ? 1 : 0, password: '' }
    : { username: '', display_name: '', role: 'maker', password: '' }
  formError.value = ''
  showEdit.value = true
}
const save = async () => {
  const f = form.value
  if (!f.username?.trim()) { formError.value = '请填写用户名'; return }
  if (!f.id && (!f.password || f.password.length < 6)) { formError.value = '初始密码至少 6 位'; return }
  if (f.id && f.password && f.password.length < 6) { formError.value = '重置密码至少 6 位'; return }
  formError.value = ''
  saving.value = true
  try {
    const body = { display_name: f.display_name, role: f.role }
    if (f.password) body.password = f.password
    if (f.id) {
      if (isSuperTarget.value) { body.role = 'super'; body.status = 1 }
      else body.status = f.status
      await api.put('/admins/' + f.id, body)
    } else {
      body.username = f.username.trim()
      await api.post('/admins', body)
    }
    showEdit.value = false
    await load()
  } catch (e) {
    formError.value = e?.message || '保存失败，请重试'
  } finally { saving.value = false }
}
const remove = async () => {
  removing.value = true
  removeError.value = ''
  try {
    await api.delete('/admins/' + confirmDel.value.id)
    confirmDel.value = null
    await load()
  } catch (e) {
    removeError.value = e?.message || '删除失败，请重试'
  } finally { removing.value = false }
}
</script>
<style scoped>
.fld{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--text3)}
.fld-hint{font-size:12px;color:var(--text3);line-height:1.6}
.super-mark{color:var(--warning);margin-left:6px;vertical-align:-1px}
.protect-hint{display:inline-flex;align-items:center;gap:3px;margin-left:8px;font-size:12px;color:var(--text3);cursor:help}
.super-note{display:flex;align-items:flex-start;gap:6px;font-size:12px;color:var(--warning);background:#FFF3E0;border-radius:6px;padding:8px 10px;line-height:1.6}
.form-err{display:flex;align-items:center;gap:4px;color:var(--danger);font-size:13px;margin-top:12px}
.empty-sub{font-size:13px;color:var(--text3);margin-top:6px;line-height:1.7}

.role-help{position:relative;display:inline-block;margin-left:4px;color:var(--text3);cursor:help;vertical-align:-1px}
.role-help:hover{color:var(--primary)}
.role-tip{display:none;position:absolute;left:-10px;top:22px;z-index:50;width:340px;background:#fff;border:1px solid var(--border);border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,.12);padding:12px 14px;font-weight:400;text-transform:none;cursor:default}
.role-help:hover .role-tip{display:block}
.role-tip b{display:block;font-size:13px;color:var(--text);margin-bottom:8px}
.role-tip-row{display:flex;gap:8px;font-size:12px;color:var(--text2);line-height:1.7;white-space:normal}
.role-tip-row i{flex:none;font-style:normal;font-weight:600;color:var(--text);width:70px}
</style>
