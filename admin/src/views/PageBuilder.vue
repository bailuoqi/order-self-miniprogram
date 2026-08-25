<template>
<div class="builder-shell">
<div class="top-toolbar">
<div class="toolbar-left">
<button class="tool-btn back-btn" title="返回后台" @click="goBack"><i class="ri-arrow-left-line"></i> 返回后台</button>
<span class="logo"><i class="ri-brush-3-line"></i> 店铺装修</span>
<span class="page-tag">首页</span>
<span v-if="draftUnpublished" class="draft-badge" title="草稿内容与已发布配置不一致，点「发布」写入线上">草稿未发布</span>
<span v-if="isDirty" class="dirty-badge" title="有修改尚未保存（Ctrl+S 保存草稿）">未保存</span>
</div>
<div class="toolbar-center">
<button :class="['tool-btn',{active:!previewMode}]" @click="previewMode=false"><i class="ri-edit-line"></i> 编辑</button>
<button :class="['tool-btn',{active:previewMode}]" @click="previewMode=true"><i class="ri-eye-line"></i> 预览</button>
<button class="tool-btn" title="撤销 Ctrl+Z" @click="undo" :disabled="historyIdx<=0"><i class="ri-arrow-go-back-line"></i></button>
<button class="tool-btn" title="重做 Ctrl+Shift+Z / Ctrl+Y" @click="redo" :disabled="historyIdx>=history.length-1"><i class="ri-arrow-go-forward-line"></i></button>
<button class="tool-btn" title="清空画布" @click="clearAll"><i class="ri-delete-bin-line"></i></button>
<div class="zoom-group" v-show="!previewMode">
<button v-for="z in zoomOpts" :key="z.v" :class="['zoom-btn',{on:zoom===z.v}]" @click="zoom=z.v">{{z.label}}</button>
</div>
</div>
<div class="toolbar-right">
<button v-if="revisionsAvailable" class="tool-btn" @click="showRevisions=true"><i class="ri-time-line"></i> 历史</button>
<button class="tool-btn" @click="showTemplates=true"><i class="ri-layout-line"></i> 模板</button>
<button class="tool-btn" @click="showGlobal=true"><i class="ri-settings-3-line"></i> 全局</button>
<button class="btn btn-outline btn-sm" title="Ctrl+S" @click="saveDraft">保存草稿</button>
<button class="btn btn-primary btn-sm" @click="publish">发布</button>
<span v-if="saveStatus==='saving'" class="save-stat"><i class="ri-loader-4-line ri-spin"></i> 保存中</span>
<span v-else-if="saveStatus==='saved'" class="save-stat ok"><i class="ri-check-line"></i> 已保存</span>
<span v-else-if="saveStatus==='error'" class="save-stat err"><i class="ri-close-line"></i> 失败<button class="retry-btn" @click="retryLast">重试</button></span>
</div>
</div>
<div class="notice-strip">
<i class="ri-plug-line"></i>
<span>已接通：发布后客户端首页按本配置渲染；标注「客户端不渲染 / 已停用」的组件会被客户端跳过。草稿存 <code>home-draft</code>（客户端可用 <code>?preview=draft</code> 预览），发布写 <code>home</code>。</span>
</div>
<div class="builder-body" v-show="!previewMode">
<div class="lib-panel">
<div class="panel-tabs">
<div v-for="t in libTabs" :key="t.key" :class="['ptab',{on:libTab===t.key}]" @click="libTab=t.key">{{t.label}}</div>
</div>
<div class="lib-list">
<div v-for="c in libGroups[libTab]" :key="c.type" class="lib-item" draggable="true"
  :title="c.noClient?'客户端首页不渲染该组件，仅后台画布展示':''"
  @dragstart="onLibDrag($event,c)" @dragend="onDragEnd">
<div class="lib-icon"><i :class="c.icon"></i></div>
<div class="lib-name">{{c.label}}</div>
<span v-if="c.noClient" class="lib-badge">客户端不渲染</span>
</div>
</div>
<div class="lib-foot"><i class="ri-plug-line"></i> 已接通客户端：发布后首页按配置渲染</div>
</div>
<div class="canvas-panel" ref="canvasPanelEl" @click.self="selIdx=-1">
<div class="phone-scale-wrap" :style="{width:phoneSize.w*scale+'px',height:phoneSize.h*scale+'px'}">
<div class="phone" ref="phoneEl" :style="{transform:'scale('+scale+')'}">
<div class="phone-top"><div class="phone-notch"></div></div>
<div class="phone-screen" @click.self="selIdx=-1">
<div class="s-navbar" v-if="global.navStyle!=='none'" :style="navBarStyle">
<div class="s-status"><span>9:41</span></div>
<div class="s-title" v-if="global.navStyle==='default'">{{global.pageTitle||'首页'}}</div>
<div class="s-search" v-if="global.navStyle==='search'"><i class="ri-search-line"></i> 搜索</div>
</div>
<div class="s-body" :style="{background:global.bgColor||'#f5f6fa'}" @dragover.prevent="onBodyDragOver" @drop.prevent="onBodyDrop" @dragleave="onBodyDragLeave">
<div v-for="(c,i) in components" :key="c._id"
  :class="['s-comp',{selected:selIdx===i,hovered:hoverIdx===i,'di-before':dropIndicator&&dropIndicator.index===i&&dropIndicator.pos==='before','di-after':dropIndicator&&dropIndicator.index===i&&dropIndicator.pos==='after'}]"
  @click.stop="selIdx=i" @dblclick.stop="focusProps(i)"
  draggable="true" @dragstart.stop="onReorderStart($event,i)" @dragend="onDragEnd"
  @dragover.prevent.stop="onCompDragOver($event,i)" @drop.stop.prevent="onCompDrop($event,i)">
<div v-if="selIdx===i" class="s-comp-bar">
<span class="s-comp-name">{{getCompLabel(c.type)}}</span>
<button @click.stop="moveUp(i)" :disabled="i===0"><i class="ri-arrow-up-s-line"></i></button>
<button @click.stop="moveDown(i)" :disabled="i===components.length-1"><i class="ri-arrow-down-s-line"></i></button>
<button v-if="!isDeprecatedType(c.type)" @click.stop="copyComp(i)"><i class="ri-file-copy-line"></i></button>
<button @click.stop="delComp(i)" class="del"><i class="ri-delete-bin-line"></i></button>
</div>
<span v-if="isNoClientType(c.type)" class="s-nr-badge">客户端不渲染</span>
<CompRenderer :type="c.type" :props="c.props" :global="global" />
</div>
<div v-if="!components.length" :class="['s-empty',{active:!!dragPayload}]">
<i class="ri-drag-drop-line"></i><p>拖拽组件到这里</p>
</div>
</div>
<div class="s-tabbar" v-if="global.showTabbar">
<div v-for="t in global.tabItems" :key="t.name" :class="['s-tab',{on:t.active}]">
<i :class="t.icon"></i><span>{{t.name}}</span>
</div>
</div>
</div>
<div class="phone-bottom"><div class="phone-home"></div></div>
</div>
</div>
</div>
<div class="prop-panel">
<div class="prop-title">{{selIdx>=0?'属性编辑':'图层列表'}}</div>
<div v-if="selIdx>=0&&components[selIdx]" class="prop-body" ref="propBodyEl">
<PropsEditor :comp="components[selIdx]" @change="saveHistory" />
</div>
<div v-else class="prop-body">
<LayerList :components="components" :selected-idx="selIdx" :meta="compMeta"
  @select="selIdx=$event" @reorder="onLayerReorder" @hover="hoverIdx=$event" />
</div>
</div>
<div v-if="loading" class="loading-mask"><i class="ri-loader-4-line ri-spin"></i> 正在载入装修配置…</div>
</div>
<div class="preview-mode" v-show="previewMode">
<div class="phone" style="margin:20px auto">
<div class="phone-top"><div class="phone-notch"></div></div>
<div class="phone-screen">
<div class="s-navbar" :style="navBarStyle" v-if="global.navStyle!=='none'">
<div class="s-status"><span>9:41</span></div>
<div class="s-title" v-if="global.navStyle==='default'">{{global.pageTitle||'首页'}}</div>
<div class="s-search" v-if="global.navStyle==='search'"><i class="ri-search-line"></i> 搜索</div>
</div>
<div class="s-body" :style="{background:global.bgColor||'#f5f6fa'}">
<CompRenderer v-for="c in components" :key="c._id" :type="c.type" :props="c.props" :global="global" :preview="true" />
</div>
<div class="s-tabbar" v-if="global.showTabbar">
<div v-for="t in global.tabItems" :key="t.name" :class="['s-tab',{on:t.active}]">
<i :class="t.icon"></i><span>{{t.name}}</span>
</div>
</div>
</div>
<div class="phone-bottom"><div class="phone-home"></div></div>
</div>
</div>
<div v-if="showTemplates" class="modal-overlay" @click.self="showTemplates=false">
<div class="modal-box">
<h3><i class="ri-layout-line"></i> 选择模板 <button class="btn btn-sm" style="float:right" @click="showTemplates=false">x</button></h3>
<div class="tpl-grid">
<div v-for="t in templates" :key="t.name" class="tpl-card" @click="applyTemplate(t)">
<div class="tpl-preview" :style="{background:t.color}">
<div class="tpl-mock">
<div v-for="(l,i) in t.preview" :key="i" :style="{height:l+'px',background:i%2?'rgba(255,255,255,.4)':'rgba(255,255,255,.25)',marginBottom:'4px',borderRadius:'3px'}"></div>
</div>
</div>
<div class="tpl-name">{{t.name}}</div>
</div>
</div>
</div>
</div>
<div v-if="showGlobal" class="modal-overlay" @click.self="showGlobal=false">
<div class="modal-box" style="width:520px">
<h3><i class="ri-settings-3-line"></i> 全局设置 <button class="btn btn-sm" style="float:right" @click="showGlobal=false">x</button></h3>
<div class="global-form">
<div class="gf-row"><label>页面标题</label><input v-model="global.pageTitle" class="fi" placeholder="首页" /></div>
<div class="gf-row"><label>背景颜色</label><div style="display:flex;gap:8px;align-items:center"><input type="color" v-model="global.bgColor" class="fcolor" /><input v-model="global.bgColor" class="fi" style="flex:1" placeholder="#f5f6fa" /></div></div>
<div class="gf-row"><label>导航样式</label><select v-model="global.navStyle" class="fi"><option value="default">默认标题</option><option value="search">搜索栏</option><option value="none">隐藏</option></select></div>
<div class="gf-row"><label>导航背景</label><input type="color" v-model="global.navBgColor" class="fcolor" /></div>
<div class="gf-row"><label>导航文字</label><input type="color" v-model="global.navTextColor" class="fcolor" /></div>
<div class="gf-row"><label>显示底部栏</label><label class="switch-sm"><input type="checkbox" v-model="global.showTabbar" /> 显示</label></div>
<div class="gf-hint">底部栏仅画布示意：客户端 tabBar 由小程序 pages.json 固定，此处配置不会下发到客户端</div>
<template v-if="global.showTabbar">
<div class="gf-row" v-for="(t,i) in global.tabItems" :key="i">
<label>Tab {{i+1}}</label>
<div style="display:flex;gap:6px;flex:1">
<select v-model="t.icon" class="fi" style="width:140px">
<option value="ri-home-4-line">首页</option><option value="ri-chat-3-line">消息</option>
<option value="ri-file-list-3-line">订单</option><option value="ri-user-3-line">我的</option>
<option value="ri-search-line">搜索</option><option value="ri-heart-line">收藏</option>
<option value="ri-shopping-bag-3-line">商城</option><option value="ri-notification-3-line">通知</option>
</select>
<input v-model="t.name" class="fi" style="flex:1" placeholder="名称" />
<label class="switch-sm" style="white-space:nowrap"><input type="checkbox" v-model="t.active" /> 激活</label>
</div>
</div>
</template>
<div class="gf-row"><label>分享标题</label><input v-model="global.shareTitle" class="fi" placeholder="微信分享标题" /></div>
<div class="gf-row"><label>分享图片URL</label><input v-model="global.shareImage" class="fi" placeholder="https://..." /></div>
<button class="btn btn-primary btn-sm" style="width:100%;margin-top:12px" @click="showGlobal=false;saveHistory()">确定</button>
</div>
</div>
</div>
<div v-if="showConfirm" class="modal-overlay" @click.self="showConfirm=false">
<div class="modal-box" style="width:380px;text-align:center">
<h3>{{confirmTitle}}</h3>
<p style="color:#888;margin:12px 0;line-height:1.6">{{confirmMsg}}</p>
<div style="display:flex;gap:10px;justify-content:center">
<button class="btn btn-outline" @click="showConfirm=false">取消</button>
<button class="btn btn-primary" @click="runConfirm">确定</button>
</div>
</div>
</div>
<div v-if="showLeaveConfirm" class="modal-overlay">
<div class="modal-box" style="width:420px">
<h3><i class="ri-error-warning-line" style="color:#faad14"></i> 有未保存的修改</h3>
<p style="color:#888;margin:12px 0;line-height:1.6">当前画布有尚未保存的修改，直接离开编辑器后这些修改将丢失。</p>
<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
<button class="btn btn-outline" @click="resolveLeave(false)">留在编辑器</button>
<button class="btn btn-outline" @click="resolveLeave(true)">不保存离开</button>
<button class="btn btn-primary" @click="saveAndLeave">保存草稿并离开</button>
</div>
</div>
</div>
<div v-if="showPublishOk" class="modal-overlay" @click.self="showPublishOk=false">
<div class="modal-box" style="width:480px">
<h3><i class="ri-checkbox-circle-fill" style="color:#52c41a"></i> 发布成功</h3>
<p style="color:#888;margin:12px 0;line-height:1.6">客户端首页将按本次发布的配置渲染；标注「客户端不渲染 / 已停用」的组件会被客户端跳过。</p>
<div class="pub-copy-row">
<input class="fi" readonly :value="draftPreviewPath" @focus="$event.target.select()" />
<button class="btn btn-outline btn-sm" @click="copyPreviewPath">{{previewCopied?'已复制':'复制客户端草稿预览地址'}}</button>
</div>
<p class="pub-copy-hint">草稿预览：将该路径拼接到客户端 H5 访问域名后打开（如 https://客户端域名{{draftPreviewPath}}），页面带「草稿预览」角标；线上首页无需带参数。</p>
<div style="text-align:right;margin-top:12px"><button class="btn btn-primary btn-sm" @click="showPublishOk=false">知道了</button></div>
</div>
</div>
<RevisionDrawer v-if="showRevisions" page-key="home" @close="showRevisions=false" @rolled-back="onRolledBack" />
</div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import CompRenderer from '@/components/CompRenderer.vue'
import PropsEditor from '@/components/PropsEditor.vue'
import LayerList from '@/components/builder/LayerList.vue'
import RevisionDrawer from '@/components/builder/RevisionDrawer.vue'
import api from '@/api'

const router = useRouter()

// ---- Component Libraries（营销 tab 二期下架，见 deprecatedComps） ----
const libTabs = [
  { key: 'basic', label: '基础' },
  { key: 'content', label: '内容' },
  { key: 'tool', label: '工具' },
]
const libTab = ref('basic')

const baseComps = [
  { type: 'banner', label: '轮播图', icon: 'ri-image-line', defaultProps: { images: [], height: 160, interval: 3000, dots: true, radius: 8 } },
  { type: 'search', label: '搜索栏', icon: 'ri-search-line', defaultProps: { placeholder: '搜索服务', bgColor: '#fff', radius: 20, hotWords: [] } },
  { type: 'notice', label: '公告栏', icon: 'ri-volume-up-line', defaultProps: { text: '重要通知内容', ico: 'ri-volume-up-line', bgColor: '#fff7e6', color: '#fa8c16' } },
  { type: 'navGrid', label: '导航宫格', icon: 'ri-apps-line', defaultProps: { items: [{ icon: 'ri-service-line', name: '服务', link: '' },{ icon: 'ri-calendar-line', name: '预约', link: '' },{ icon: 'ri-star-line', name: '推荐', link: '' },{ icon: 'ri-more-line', name: '更多', link: '' }], columns: 4, gutter: 8 } },
  { type: 'titleBar', label: '标题栏', icon: 'ri-text', defaultProps: { title: '热门推荐', subtitle: '', moreText: '更多', moreLink: '', align: 'left' } },
  // imageAd 不再提供 width（客户端恒 100% 宽）
  { type: 'imageAd', label: '图片广告', icon: 'ri-advertisement-line', defaultProps: { src: '', link: '', height: 120, radius: 8 } },
]

const contentComps = [
  { type: 'goodsRow', label: '商品行', icon: 'ri-shopping-bag-3-line', defaultProps: { title: '精选商品', goods: [], layout: 'scroll', showBadge: true, columns: 2 } },
  { type: 'articleList', label: '文章列表', icon: 'ri-article-line', noClient: true, defaultProps: { title: '最新资讯', count: 3, showCover: true, showDate: true, cmsType: '' } },
  { type: 'videoPlayer', label: '视频播放', icon: 'ri-video-line', noClient: true, defaultProps: { src: '', poster: '', autoplay: false, height: 200 } },
  { type: 'richText', label: '富文本', icon: 'ri-file-text-line', defaultProps: { content: '<p>编辑内容...</p>', padding: 12 } },
]

const toolComps = [
  { type: 'floatingBtn', label: '悬浮按钮', icon: 'ri-customer-service-2-line', noClient: true, defaultProps: { text: '客服', ico: 'ri-customer-service-2-line', position: 'right', bottom: 80, link: '' } },
  { type: 'divider', label: '分割线', icon: 'ri-separator', defaultProps: { height: 1, color: '#eee', margin: '12px 0', style: 'solid' } },
  { type: 'blank', label: '空白占位', icon: 'ri-layout-bottom-line', defaultProps: { height: 10, bgColor: 'transparent' } },
]

// 营销组件二期下架（产品无优惠券/秒杀业务模型）：不可再添加；
// 存量实例画布显示停用占位、可选中删除、发布数据原样保留（客户端按未知类型跳过）
const deprecatedComps = [
  { type: 'coupon', label: '优惠券' },
  { type: 'countdown', label: '倒计时' },
  { type: 'groupBuy', label: '拼团' },
  { type: 'seckill', label: '秒杀' },
]
const deprecatedTypeSet = new Set(deprecatedComps.map(c => c.type))
function isDeprecatedType(type) { return deprecatedTypeSet.has(type) }

const allComps = [...baseComps, ...contentComps, ...toolComps]
const libGroups = { basic: baseComps, content: contentComps, tool: toolComps }
const noClientTypeSet = new Set(allComps.filter(c => c.noClient).map(c => c.type))
function isNoClientType(type) { return noClientTypeSet.has(type) }
const compMeta = {
  ...Object.fromEntries(allComps.map(c => [c.type, { label: c.label, icon: c.icon }])),
  ...Object.fromEntries(deprecatedComps.map(c => [c.type, { label: c.label + '（已停用）', icon: 'ri-forbid-line' }])),
}

// ---- State ----
const previewMode = ref(false)
const selIdx = ref(-1)
const hoverIdx = ref(-1)
const showTemplates = ref(false)
const showGlobal = ref(false)
const saveStatus = ref('')
const loading = ref(true)
const showConfirm = ref(false)
const confirmTitle = ref('')
const confirmMsg = ref('')
let confirmAction = () => {}
const showLeaveConfirm = ref(false)
let leaveResolver = null
let lastSaveOp = 'draft'

const global = reactive({
  pageTitle: '首页',
  bgColor: '#f5f6fa',
  navStyle: 'default',
  navBgColor: '#ffffff',
  navTextColor: '#333333',
  showTabbar: true,
  shareTitle: '',
  shareImage: '',
  tabItems: [
    { icon: 'ri-home-4-line', name: '首页', active: true },
    { icon: 'ri-chat-3-line', name: '消息', active: false },
    { icon: 'ri-file-list-3-line', name: '订单', active: false },
    { icon: 'ri-user-3-line', name: '我的', active: false },
  ],
})

const components = ref([])

// ---- Undo/Redo History ----
const history = ref([])
const historyIdx = ref(-1)

function saveHistory() {
  const snap = JSON.parse(JSON.stringify({ components: components.value, global: { ...global } }))
  historyIdx.value++
  history.value = history.value.slice(0, historyIdx.value)
  history.value.push(snap)
  if (history.value.length > 50) { history.value.shift(); historyIdx.value-- }
}

function undo() {
  if (historyIdx.value <= 0) return
  historyIdx.value--
  restoreSnapshot(history.value[historyIdx.value])
}

function redo() {
  if (historyIdx.value >= history.value.length - 1) return
  historyIdx.value++
  restoreSnapshot(history.value[historyIdx.value])
}

function restoreSnapshot(snap) {
  components.value = JSON.parse(JSON.stringify(snap.components))
  Object.assign(global, JSON.parse(JSON.stringify(snap.global)))
  selIdx.value = -1
}

// ---- Dirty tracking（未保存拦截的脏标记）----
const lastSavedStr = ref('')
function serializeState() {
  return JSON.stringify({ components: components.value, global })
}
const isDirty = computed(() => !loading.value && serializeState() !== lastSavedStr.value)

// ---- Draft / Publish channel state ----
const draftUnpublished = ref(false)
const publishedStr = ref('')
const showPublishOk = ref(false)
const previewCopied = ref(false)
// 客户端 H5 为 hash 路由：拼接到客户端域名后访问，首页读 home-draft 并带「草稿预览」角标
const draftPreviewPath = '/#/?preview=draft'

// ---- Revision history（C2 服务端通道；接口不可用即整体隐藏入口）----
const revisionsAvailable = ref(false)
const showRevisions = ref(false)

// ---- Helpers ----
let idCounter = Date.now()
function genId() { return 'c_' + (idCounter++) }

function getCompLabel(type) {
  const m = compMeta[type]
  return m ? m.label : type
}

function getCompDefaults(type) {
  const c = allComps.find(x => x.type === type)
  return c ? JSON.parse(JSON.stringify(c.defaultProps)) : {}
}

function ensureIds(list) {
  return (list || []).map(c => ({ _id: c._id || genId(), type: c.type, props: c.props || {} }))
}

function openConfirm(title, msg, action) {
  confirmTitle.value = title
  confirmMsg.value = msg
  confirmAction = action
  showConfirm.value = true
}

function runConfirm() {
  showConfirm.value = false
  confirmAction()
}

// ---- Drag & Drop（lib:/sort: 前缀 + 模块级变量；dragover 阶段读不到 data，用变量判断源）----
const dragPayload = ref(null) // {kind:'lib', type} | {kind:'sort', index}
const dropIndicator = ref(null) // {index, pos:'before'|'after'}

function onLibDrag(e, comp) {
  dragPayload.value = { kind: 'lib', type: comp.type }
  e.dataTransfer.setData('text/plain', 'lib:' + comp.type)
  e.dataTransfer.effectAllowed = 'copy'
}

function onReorderStart(e, idx) {
  dragPayload.value = { kind: 'sort', index: idx }
  e.dataTransfer.setData('text/plain', 'sort:' + idx)
  e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  dragPayload.value = null
  dropIndicator.value = null
}

function onCompDragOver(e, i) {
  if (!dragPayload.value) return
  // 用元素中线判断上/下半区：clientY 与 rect 同为屏幕坐标，缩放态下无需除以缩放系数
  const rect = e.currentTarget.getBoundingClientRect()
  const pos = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
  dropIndicator.value = { index: i, pos }
}

function onBodyDragOver() {
  if (!dragPayload.value) return
  // 拖到组件间空白/画布尾部：指示追加到末尾（组件自身的 dragover 已 stop，不会走到这里）
  if (components.value.length) dropIndicator.value = { index: components.value.length - 1, pos: 'after' }
}

function onBodyDragLeave(e) {
  if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) dropIndicator.value = null
}

function parseDragData(e) {
  const raw = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || ''
  if (raw.startsWith('lib:')) return { kind: 'lib', type: raw.slice(4) }
  if (raw.startsWith('sort:')) return { kind: 'sort', index: parseInt(raw.slice(5), 10) }
  return dragPayload.value
}

function onCompDrop(e, i) {
  const ind = dropIndicator.value
  const insertIdx = (ind && ind.index === i) ? (ind.pos === 'before' ? i : i + 1) : i + 1
  handleDrop(e, insertIdx)
}

function onBodyDrop(e) {
  const ind = dropIndicator.value
  const insertIdx = ind ? (ind.pos === 'before' ? ind.index : ind.index + 1) : components.value.length
  handleDrop(e, insertIdx)
}

function handleDrop(e, insertIdx) {
  const payload = parseDragData(e)
  dropIndicator.value = null
  dragPayload.value = null
  if (!payload) return
  if (payload.kind === 'lib') {
    if (!allComps.find(c => c.type === payload.type)) return
    components.value.splice(insertIdx, 0, { _id: genId(), type: payload.type, props: getCompDefaults(payload.type) })
    selIdx.value = insertIdx
    saveHistory()
  } else if (payload.kind === 'sort') {
    const from = payload.index
    if (!Number.isInteger(from) || from < 0 || from >= components.value.length) return
    let to = insertIdx
    if (from < to) to--
    if (to === from) return
    const item = components.value.splice(from, 1)[0]
    components.value.splice(to, 0, item)
    selIdx.value = to
    saveHistory()
  }
}

function onLayerReorder({ from, to }) {
  if (from === to || from < 0 || from >= components.value.length) return
  const item = components.value.splice(from, 1)[0]
  components.value.splice(to, 0, item)
  selIdx.value = to
  saveHistory()
}

// ---- Component Operations ----
function moveUp(i) {
  if (i > 0) {
    [components.value[i], components.value[i - 1]] = [components.value[i - 1], components.value[i]]
    selIdx.value = i - 1
    saveHistory()
  }
}

function moveDown(i) {
  if (i < components.value.length - 1) {
    [components.value[i], components.value[i + 1]] = [components.value[i + 1], components.value[i]]
    selIdx.value = i + 1
    saveHistory()
  }
}

function copyComp(i) {
  const clone = JSON.parse(JSON.stringify(components.value[i]))
  clone._id = genId()
  components.value.splice(i + 1, 0, clone)
  selIdx.value = i + 1
  saveHistory()
}

function delComp(i) {
  components.value.splice(i, 1)
  selIdx.value = -1
  saveHistory()
}

function clearAll() {
  openConfirm('清空所有组件', '确定要清空画布上所有组件吗？此操作可撤销。', () => {
    components.value = []
    selIdx.value = -1
    saveHistory()
  })
}

const propBodyEl = ref(null)
function focusProps(i) {
  selIdx.value = i
  nextTick(() => {
    const el = propBodyEl.value && propBodyEl.value.querySelector('input,textarea,select')
    if (el) el.focus()
  })
}

// ---- Canvas Zoom ----
const zoomOpts = [
  { v: '75', label: '75%' },
  { v: '100', label: '100%' },
  { v: '125', label: '125%' },
  { v: 'fit', label: '适应' },
]
const zoom = ref('fit')
const fitScale = ref(1)
const scale = computed(() => zoom.value === 'fit' ? fitScale.value : Number(zoom.value) / 100)
const canvasPanelEl = ref(null)
const phoneEl = ref(null)
const phoneSize = reactive({ w: 391, h: 700 })
let resizeObserver = null

function measurePhone() {
  if (!phoneEl.value) return
  // offsetWidth/offsetHeight 为布局尺寸，不受 transform:scale 影响
  phoneSize.w = phoneEl.value.offsetWidth || 391
  phoneSize.h = phoneEl.value.offsetHeight || 700
  computeFit()
}

function computeFit() {
  const panel = canvasPanelEl.value
  if (!panel) return
  const avail = panel.clientHeight - 32
  fitScale.value = Math.min(1, Math.max(0.4, avail / (phoneSize.h || 700)))
}

// ---- Templates ----
const templates = [
  {
    name: '默认风格', color: '#4A90D9', preview: [24, 12, 40, 16, 12, 30, 16],
    components: [
      { type: 'search', props: { placeholder: '搜索服务', bgColor: '#fff', radius: 20 } },
      { type: 'banner', props: { images: [], height: 160, dots: true, radius: 8 } },
      { type: 'navGrid', props: { items: [{ icon: 'ri-service-line', name: '服务' }, { icon: 'ri-calendar-line', name: '预约' }, { icon: 'ri-star-line', name: '推荐' }, { icon: 'ri-more-line', name: '更多' }], columns: 4 } },
      { type: 'notice', props: { text: '软件定制 / 电子代做，先报价后开工', ico: 'ri-volume-up-line', bgColor: '#fff7e6', color: '#fa8c16' } },
      { type: 'titleBar', props: { title: '热门服务', moreText: '更多' } },
      { type: 'goodsRow', props: { title: '精选服务', goods: [], layout: 'scroll', showBadge: true, columns: 2 } },
    ]
  },
  {
    // 二期营销组件下架：模板同步清理 countdown/coupon/seckill，以公告与商品栅格保留促销氛围
    name: '营销风格', color: '#FF6B6B', preview: [28, 12, 18, 14, 24],
    components: [
      { type: 'banner', props: { images: [], height: 150, dots: true, radius: 8 } },
      { type: 'notice', props: { text: '限时特惠进行中，联系客服获取报价', ico: 'ri-volume-up-line', bgColor: '#fff1f0', color: '#ff4d4f' } },
      { type: 'titleBar', props: { title: '爆款推荐', moreText: '全部' } },
      { type: 'goodsRow', props: { title: '', goods: [], layout: 'grid', columns: 2 } },
    ]
  },
  {
    name: '极简风格', color: '#2D2D2D', preview: [20, 10, 8, 30, 12, 20],
    components: [
      { type: 'banner', props: { images: [], height: 180, dots: false, radius: 0 } },
      { type: 'navGrid', props: { items: [{ icon: 'ri-service-line', name: '服务' }, { icon: 'ri-star-line', name: '推荐' }], columns: 4 } },
      { type: 'titleBar', props: { title: '精选', align: 'center' } },
      { type: 'goodsRow', props: { title: '', goods: [], layout: 'grid', columns: 2 } },
    ]
  },
  {
    name: '品牌风格', color: '#7C5CFC', preview: [16, 32, 10, 14, 18, 20, 12],
    components: [
      { type: 'banner', props: { images: [], height: 200, dots: true, radius: 0 } },
      { type: 'notice', props: { text: '品质服务，值得信赖', bgColor: '#f0f0ff', color: '#7C5CFC' } },
      { type: 'navGrid', props: { items: [{ icon: 'ri-service-line', name: '服务' }, { icon: 'ri-calendar-line', name: '预约' }, { icon: 'ri-star-line', name: '推荐' }, { icon: 'ri-more-line', name: '更多' }], columns: 4 } },
      { type: 'titleBar', props: { title: '品牌服务', subtitle: '专业认证' } },
      { type: 'goodsRow', props: { title: '', goods: [], layout: 'grid', columns: 2 } },
    ]
  },
]

function applyTemplate(tpl) {
  openConfirm('应用模板', '确定应用模板「' + tpl.name + '」？当前画布内容将被替换（可一步撤销）。', () => {
    components.value = tpl.components.map(c => ({
      _id: genId(),
      type: c.type,
      props: JSON.parse(JSON.stringify(c.props || getCompDefaults(c.type)))
    }))
    selIdx.value = -1
    saveHistory()
    showTemplates.value = false
  })
}

// ---- Nav Bar Style ----
const navBarStyle = computed(() => ({
  background: global.navBgColor || '#ffffff',
  color: global.navTextColor || '#333333',
}))

// ---- Save / Publish（通道分离：草稿 home-draft，发布 home）----
let savedTimer = null
function markSaved() {
  saveStatus.value = 'saved'
  if (savedTimer) clearTimeout(savedTimer)
  savedTimer = setTimeout(() => { if (saveStatus.value === 'saved') saveStatus.value = '' }, 2000)
}

function buildPayload() {
  return JSON.parse(JSON.stringify({ schemaVersion: 1, components: components.value, global }))
}

async function saveDraft() {
  if (loading.value || saveStatus.value === 'saving') return false
  lastSaveOp = 'draft'
  saveStatus.value = 'saving'
  try {
    await api.put('/page-config/home-draft', { config: buildPayload() })
    lastSavedStr.value = serializeState()
    draftUnpublished.value = lastSavedStr.value !== publishedStr.value
    markSaved()
    return true
  } catch (e) {
    console.error('Save draft failed:', e)
    saveStatus.value = 'error'
    return false
  }
}

function publish() {
  openConfirm(
    '确认发布',
    '发布会把当前内容写入线上配置（page-config/home）并同步草稿，客户端首页将按本配置渲染（标注「客户端不渲染 / 已停用」的组件会被跳过）。确定发布？',
    publishNow
  )
}

async function publishNow() {
  if (loading.value || saveStatus.value === 'saving') return false
  lastSaveOp = 'publish'
  saveStatus.value = 'saving'
  const payload = buildPayload()
  let ok = false
  // 优先走服务端发布通道（一次调用完成保存+发布并写入发布历史）；
  // C2 端点未部署（404）或失败时回退一期双 PUT，任意合并顺序可用
  try {
    await api.post('/page-config/home/publish', { config: payload })
    ok = true
    // publish 端点在即说明服务端通道已部署，顺带探活历史入口
    if (!revisionsAvailable.value) probeRevisions()
  } catch (e) {
    try {
      await api.put('/page-config/home', { config: payload })
      // 同步草稿通道，避免下次进入时旧草稿覆盖已发布内容
      await api.put('/page-config/home-draft', { config: payload })
      ok = true
    } catch (e2) {
      console.error('Publish failed:', e2)
    }
  }
  if (!ok) {
    saveStatus.value = 'error'
    return false
  }
  lastSavedStr.value = serializeState()
  publishedStr.value = lastSavedStr.value
  draftUnpublished.value = false
  markSaved()
  previewCopied.value = false
  showPublishOk.value = true
  return true
}

async function copyPreviewPath() {
  let copied = false
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(draftPreviewPath)
      copied = true
    }
  } catch (e) { /* 非安全上下文等场景走降级 */ }
  if (!copied) {
    const ta = document.createElement('textarea')
    ta.value = draftPreviewPath
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try { copied = document.execCommand('copy') } catch (e) { copied = false }
    document.body.removeChild(ta)
  }
  previewCopied.value = copied
}

function retryLast() {
  if (lastSaveOp === 'publish') publishNow()
  else saveDraft()
}

// ---- Load config（三形状嗅探：新规范 {schemaVersion,components,global} / 直接对象 / 旧 {data:"json"} 双重 JSON）----
function sniffConfig(raw) {
  let v = raw
  try {
    if (typeof v === 'string') v = JSON.parse(v)
    if (v && typeof v === 'object') {
      if (typeof v.data === 'string') v = JSON.parse(v.data)
      else if (v.data && typeof v.data === 'object') v = v.data
    }
    if (v && typeof v === 'object' && v.config && typeof v.config === 'object' && !Array.isArray(v.components)) v = v.config
  } catch (e) {
    return null
  }
  if (!v || typeof v !== 'object' || !Array.isArray(v.components)) return null
  return { components: v.components, global: (v.global && typeof v.global === 'object') ? v.global : null }
}

async function loadConfig() {
  const [draftRes, homeRes] = await Promise.allSettled([
    api.get('/page-config/home-draft'),
    api.get('/page-config/home'),
  ])
  const draft = draftRes.status === 'fulfilled' ? sniffConfig(draftRes.value) : null
  const published = homeRes.status === 'fulfilled' ? sniffConfig(homeRes.value) : null
  const src = draft || published
  if (src) {
    components.value = ensureIds(src.components)
    if (src.global) Object.assign(global, JSON.parse(JSON.stringify(src.global)))
  }
  const draftDiffers = !!draft && JSON.stringify(draft) !== JSON.stringify(published)
  draftUnpublished.value = draftDiffers
  publishedStr.value = draftDiffers
    ? (published ? JSON.stringify({ components: published.components, global: published.global }) : '')
    : serializeState()
}

// ---- Revision history（探测 C2 revisions 端点：404/失败即整体隐藏历史入口）----
async function probeRevisions() {
  try {
    await api.get('/page-config/home/revisions')
    revisionsAvailable.value = true
  } catch (e) {
    revisionsAvailable.value = false
  }
}

// 回滚成功：服务端已把目标版本写回 home 与 home-draft，重载画布并重打首帧快照
async function onRolledBack() {
  showRevisions.value = false
  loading.value = true
  selIdx.value = -1
  try {
    await loadConfig()
  } finally {
    loading.value = false
    lastSavedStr.value = serializeState()
    history.value = []
    historyIdx.value = -1
    saveHistory()
  }
}

// ---- Keyboard Shortcuts（onMounted 挂载 / onUnmounted 注销，离开页面后不再劫持）----
function onKeydown(e) {
  const t = e.target
  const inField = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
  const mod = e.ctrlKey || e.metaKey
  if (mod && (e.key === 's' || e.key === 'S')) { e.preventDefault(); saveDraft(); return }
  if (inField) return
  if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo(); return }
  if (mod && (e.key === 'y' || e.key === 'Y' || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))) { e.preventDefault(); redo(); return }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selIdx.value >= 0) { e.preventDefault(); delComp(selIdx.value) }
}

function onBeforeUnload(e) {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

// ---- Leave guard（未保存拦截）----
onBeforeRouteLeave(() => {
  if (!isDirty.value) return true
  return new Promise(resolve => {
    leaveResolver = resolve
    showLeaveConfirm.value = true
  })
})

function resolveLeave(ok) {
  showLeaveConfirm.value = false
  if (leaveResolver) {
    leaveResolver(ok)
    leaveResolver = null
  }
}

async function saveAndLeave() {
  const ok = await saveDraft()
  resolveLeave(ok)
}

function goBack() {
  router.push('/dashboard')
}

// ---- Lifecycle ----
onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('beforeunload', onBeforeUnload)
  window.addEventListener('resize', computeFit)
  if (typeof ResizeObserver !== 'undefined' && phoneEl.value) {
    resizeObserver = new ResizeObserver(measurePhone)
    resizeObserver.observe(phoneEl.value)
  }
  probeRevisions()
  try {
    await loadConfig()
  } finally {
    loading.value = false
    lastSavedStr.value = serializeState()
    // 载入完成后再打首帧快照：undo 至 0 号 = 载入时状态而非空画布
    history.value = []
    historyIdx.value = -1
    saveHistory()
    nextTick(measurePhone)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('beforeunload', onBeforeUnload)
  window.removeEventListener('resize', computeFit)
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null }
  if (savedTimer) clearTimeout(savedTimer)
})
</script>


<style scoped>
.builder-shell{position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;background:#f0f2f5}
.top-toolbar{display:flex;align-items:center;justify-content:space-between;padding:0 16px;height:50px;background:#fff;border-bottom:1px solid #e8e8e8;flex-shrink:0;gap:12px}
.toolbar-left{display:flex;align-items:center;gap:10px}
.back-btn{font-weight:500}
.logo{font-weight:700;color:#2979FF;font-size:15px;display:flex;align-items:center;gap:6px}
.logo i{font-size:18px}
.page-tag{font-size:12px;color:#999;background:#f0f0f0;padding:2px 10px;border-radius:10px}
.draft-badge{font-size:11px;background:#fff7e6;color:#d46b08;border:1px solid #ffd591;padding:2px 8px;border-radius:10px;white-space:nowrap}
.dirty-badge{font-size:11px;background:#fff1f0;color:#cf1322;border:1px solid #ffa39e;padding:2px 8px;border-radius:10px;white-space:nowrap}
.toolbar-center{display:flex;gap:4px;align-items:center}
.tool-btn{padding:6px 12px;border:1px solid #d9d9d9;background:#fff;border-radius:6px;cursor:pointer;font-size:12px;display:flex;align-items:center;gap:4px;color:#555;transition:.15s}
.tool-btn:hover{color:#2979FF;border-color:#2979FF}
.tool-btn.active{background:#2979FF;color:#fff;border-color:#2979FF}
.tool-btn:disabled{opacity:.35;cursor:not-allowed}
.zoom-group{display:flex;border:1px solid #d9d9d9;border-radius:6px;overflow:hidden;margin-left:8px}
.zoom-btn{padding:6px 9px;font-size:12px;background:#fff;border:none;border-right:1px solid #eee;cursor:pointer;color:#555}
.zoom-btn:last-child{border-right:none}
.zoom-btn:hover{color:#2979FF}
.zoom-btn.on{background:#2979FF;color:#fff}
.toolbar-right{display:flex;align-items:center;gap:8px}
.save-stat{font-size:12px;display:flex;align-items:center;gap:4px}
.save-stat.ok{color:#52c41a}
.save-stat.err{color:#ff4d4f}
.retry-btn{border:1px solid #ffa39e;background:#fff;color:#ff4d4f;border-radius:4px;font-size:11px;padding:2px 8px;cursor:pointer;margin-left:4px}
.retry-btn:hover{background:#fff1f0}
.notice-strip{display:flex;align-items:center;gap:8px;padding:6px 16px;background:#e6f4ff;border-bottom:1px solid #91caff;color:#0958d9;font-size:12px;flex-shrink:0;line-height:1.5}
.notice-strip i{font-size:14px;flex-shrink:0}
.notice-strip code{background:rgba(0,0,0,.06);padding:0 4px;border-radius:3px;font-size:11px}
.builder-body{display:flex;flex:1;overflow:hidden;position:relative}
.loading-mask{position:absolute;inset:0;z-index:60;background:rgba(255,255,255,.65);display:flex;align-items:center;justify-content:center;gap:8px;color:#2979FF;font-size:14px}
.lib-panel{width:240px;background:#fff;border-right:1px solid #e8e8e8;display:flex;flex-direction:column;flex-shrink:0}
.panel-tabs{display:flex;border-bottom:1px solid #e8e8e8;padding:0 8px}
.ptab{flex:1;text-align:center;padding:10px 0;font-size:12px;color:#888;cursor:pointer;border-bottom:2px solid transparent;transition:.15s}
.ptab.on{color:#2979FF;border-bottom-color:#2979FF;font-weight:600}
.lib-list{padding:10px;overflow-y:auto;display:grid;grid-template-columns:1fr 1fr;gap:8px;flex:1;align-content:start}
.lib-item{position:relative;padding:12px 8px;border:1px solid #f0f0f0;border-radius:8px;cursor:grab;text-align:center;transition:.15s;user-select:none}
.lib-item:hover{border-color:#2979FF;background:#f5f8ff;box-shadow:0 2px 8px rgba(41,121,255,.1)}
.lib-icon{font-size:22px;color:#2979FF;margin-bottom:4px}
.lib-name{font-size:11px;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lib-badge{position:absolute;top:3px;right:3px;font-size:9px;background:#f0f0f0;color:#999;padding:1px 4px;border-radius:6px;line-height:1.4}
.lib-foot{padding:8px 12px;border-top:1px solid #f0f0f0;font-size:11px;color:#bbb;display:flex;align-items:center;gap:4px;line-height:1.4;flex-shrink:0}
.canvas-panel{flex:1;display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow:auto;background:#e8ecf1}
.phone-scale-wrap{position:relative;flex-shrink:0}
.phone{width:375px;border-radius:28px;background:#1a1a2e;padding:12px 8px;box-shadow:0 8px 40px rgba(0,0,0,.18);transform-origin:top left}
.phone-top{height:24px;display:flex;justify-content:center}
.phone-notch{width:120px;height:22px;background:#1a1a2e;border-radius:0 0 14px 14px}
.phone-screen{background:#fff;border-radius:4px;overflow:hidden;min-height:600px;display:flex;flex-direction:column;position:relative}
.phone-bottom{height:20px;display:flex;justify-content:center;align-items:flex-end}
.phone-home{width:100px;height:4px;background:#555;border-radius:2px}
.s-navbar{padding:8px 14px 6px;font-size:13px;font-weight:600}
.s-status{font-size:11px;opacity:.6;margin-bottom:2px}
.s-title{font-size:15px;text-align:center}
.s-search{display:flex;align-items:center;gap:6px;background:rgba(0,0,0,.05);border-radius:16px;padding:6px 12px;font-size:12px;font-weight:400;color:#999}
.s-body{flex:1;padding:8px;min-height:400px}
.s-comp{position:relative;margin-bottom:6px;border:2px solid transparent;border-radius:6px;transition:border-color .15s,box-shadow .15s}
.s-comp.selected{border-color:#2979FF;box-shadow:0 0 0 2px rgba(41,121,255,.2)}
.s-comp.hovered{border-color:rgba(41,121,255,.55)}
.s-comp.di-before::before,.s-comp.di-after::after{content:'';position:absolute;left:-4px;right:-4px;height:3px;background:#2979FF;border-radius:2px;z-index:20;box-shadow:0 0 4px rgba(41,121,255,.8);pointer-events:none}
.s-comp.di-before::before{top:-5px}
.s-comp.di-after::after{bottom:-5px}
.s-comp-bar{position:absolute;top:-36px;left:0;right:0;display:flex;align-items:center;gap:4px;background:#2979FF;color:#fff;padding:4px 8px;border-radius:6px 6px 0 0;font-size:11px;z-index:10}
.s-comp-bar .s-comp-name{flex:1;font-weight:600;font-size:11px}
.s-comp-bar button{background:none;border:none;color:#fff;cursor:pointer;padding:2px 4px;border-radius:3px;font-size:14px;display:flex;align-items:center}
.s-comp-bar button:hover{background:rgba(255,255,255,.2)}
.s-comp-bar button.del:hover{background:#ff4d4f}
.s-nr-badge{position:absolute;top:4px;right:4px;z-index:5;font-size:9px;background:rgba(0,0,0,.45);color:#fff;padding:1px 6px;border-radius:8px;line-height:1.6;pointer-events:none}
.s-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;color:#bbb;border:2px dashed #ddd;border-radius:10px;min-height:200px;transition:.15s}
.s-empty.active{border-color:#2979FF;background:rgba(41,121,255,.05);color:#2979FF}
.s-empty i{font-size:36px;margin-bottom:8px}
.s-tabbar{display:flex;border-top:1px solid #eee;padding:4px 0 2px;background:#fff}
.s-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10px;color:#999;padding:4px 0}
.s-tab i{font-size:18px}
.s-tab.on{color:#2979FF}
.prop-panel{width:300px;background:#fff;border-left:1px solid #e8e8e8;display:flex;flex-direction:column;flex-shrink:0}
.prop-title{padding:12px 16px;font-weight:600;font-size:14px;border-bottom:1px solid #f0f0f0;color:#333;flex-shrink:0}
.prop-body{flex:1;overflow-y:auto;padding:12px}
.preview-mode{flex:1;display:flex;align-items:flex-start;justify-content:center;background:#d0d5dd;overflow-y:auto}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:1000}
.modal-box{background:#fff;border-radius:12px;padding:24px;max-height:80vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,.15)}
.modal-box h3{font-size:16px;margin:0 0 16px;display:flex;align-items:center;gap:8px}
.tpl-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.tpl-card{border:2px solid #eee;border-radius:10px;padding:10px;cursor:pointer;transition:.15s}
.tpl-card:hover{border-color:#2979FF;box-shadow:0 4px 16px rgba(41,121,255,.15)}
.tpl-preview{height:120px;border-radius:6px;padding:8px;display:flex;align-items:flex-start;overflow:hidden}
.tpl-mock{flex:1}
.tpl-name{text-align:center;margin-top:8px;font-size:13px;font-weight:600;color:#333}
.global-form{display:flex;flex-direction:column;gap:10px}
.gf-row{display:flex;align-items:center;gap:10px}
.gf-row label{width:80px;font-size:13px;color:#555;flex-shrink:0}
.gf-hint{font-size:11px;color:#bbb;line-height:1.5;margin:-4px 0 0 90px}
.pub-copy-row{display:flex;gap:8px;align-items:center}
.pub-copy-row .fi{background:#fafafa;color:#555}
.pub-copy-row .btn{white-space:nowrap;flex-shrink:0}
.pub-copy-hint{font-size:11px;color:#999;line-height:1.6;margin:8px 0 0}
.fi{flex:1;padding:7px 10px;border:1px solid #d9d9d9;border-radius:6px;font-size:13px;outline:none}
.fi:focus{border-color:#2979FF;box-shadow:0 0 0 2px rgba(41,121,255,.1)}
.fcolor{width:32px;height:32px;border:none;border-radius:6px;cursor:pointer;padding:0}
.switch-sm{display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer}
.btn{padding:7px 16px;border-radius:6px;font-size:13px;cursor:pointer;border:none;font-weight:500;transition:.15s}
.btn-primary{background:#2979FF;color:#fff}
.btn-primary:hover{background:#1c6ae0}
.btn-outline{border:1px solid #d9d9d9;background:#fff;color:#555}
.btn-outline:hover{border-color:#2979FF;color:#2979FF}
.btn-sm{padding:5px 12px;font-size:12px}
.ri-spin{animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@media (min-width:1900px){
  .lib-panel{width:260px}
  .lib-list{grid-template-columns:repeat(3,1fr)}
  .prop-panel{width:320px}
}
</style>
