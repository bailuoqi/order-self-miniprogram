<template>
  <view class="page-index" :style="pageBgStyle">
    <!-- 自定义导航栏（chrome 常驻：配置生效时仅吃 global 配色，宽屏下隐藏交给 topWindow） -->
    <view class="nav-bar" :style="navBarStyle">
      <view class="nav-content">
        <view class="nav-brand">
          <text class="brand-name" :style="navTextStyle">{{ brandName }}</text>
        </view>
        <view class="nav-search" :class="{ 'nav-search--flat': pageConfig }" @click="goCategory">
          <i class="ri-search-2-line" style="font-size:28rpx;color:#999;" />
          <text class="search-placeholder">搜索软件定制或电子代做</text>
        </view>
        <view class="nav-avatar" @click="goMy">
          <image class="avatar-img" :src="userAvatar || '/static/icons/default-avatar.png'" mode="aspectFill" />
        </view>
      </view>
    </view>

    <!-- #ifdef H5 -->
    <!-- 草稿预览角标（?preview=draft 手机宽读 home-draft、桌面视口读 home-pc-draft，均不写缓存） -->
    <view v-if="isDraftPreview" class="draft-badge">草稿预览</view>

    <!-- 装修配置电脑版内容区（P3 / T10）：桌面视口（≥768）且 home-pc 合法时替换渲染 -->
    <config-blocks-pc v-if="showPcBlocks" :components="pcPageConfig.components" :global="pcPageConfig.global" />
    <!-- #endif -->

    <!-- 装修配置版内容区：合法 schemaVersion:1 配置全量替换渲染（二期 C1）；
         电脑版分支未生效时（showPcBlocks 在小程序端恒 false）行为与现状一致 -->
    <config-blocks v-if="!showPcBlocks && pageConfig" :components="pageConfig.components" :global="pageConfig.global" />

    <!-- 硬编码兜底版式：配置缺失/旧形状/为空/请求失败时原样渲染 -->
    <template v-else-if="!showPcBlocks">
    <!-- 品牌横幅 -->
    <view class="hero-card">
      <text class="hero-title">软件定制 · 电子代做</text>
      <text class="hero-sub">先报价后开工，付定金开做，交付满意结尾款</text>
      <view class="hero-steps">
        <text class="hero-step">下单</text><text class="hero-arrow">→</text>
        <text class="hero-step">报价</text><text class="hero-arrow">→</text>
        <text class="hero-step">定金</text><text class="hero-arrow">→</text>
        <text class="hero-step">制作</text><text class="hero-arrow">→</text>
        <text class="hero-step">交付</text><text class="hero-arrow">→</text>
        <text class="hero-step">尾款</text>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-entries">
      <view class="qe-card clickable" v-for="item in quickEntries" :key="item.key" @click="onEntry(item)">
        <view class="qe-icon-box" :style="{ background: item.bgColor }">
          <i :class="'ri-' + item.icon" :style="{ color: item.iconColor, fontSize: '48rpx' }" />
        </view>
        <text class="qe-label">{{ item.label }}</text>
      </view>
    </view>

    <!-- 公告栏 -->
    <view class="notice-bar" v-if="notice.text">
      <view class="notice-icon-box">
        <i class="ri-alarm-line" style="font-size:32rpx;color:#FF9100;" />
      </view>
      <view class="notice-content">
        <text class="notice-tag">公告</text>
        <text class="notice-text">{{ notice.text }}</text>
      </view>
    </view>

    <!-- 服务保障 -->
    <view class="guarantee-bar">
      <view class="g-item" v-for="g in guarantees" :key="g.title">
        <view class="g-icon-box">
          <i :class="'ri-' + g.icon" style="font-size:40rpx;color:#2979FF;" />
        </view>
        <view class="g-texts">
          <text class="g-title">{{ g.title }}</text>
          <text class="g-desc">{{ g.desc }}</text>
        </view>
      </view>
    </view>

    <!-- 服务分类（软件定制 / 电子代做） -->
    <view class="section" v-for="group in categoryGroups" :key="group.key">
      <view class="section-header">
        <text class="section-title">{{ group.title }}</text>
        <view class="section-more clickable" @click="goCategory">
          <text>全部</text>
          <i class="ri-arrow-right-s-line" style="font-size:28rpx;" />
        </view>
      </view>
      <view class="category-grid">
        <view class="category-item clickable" v-for="cat in group.items" :key="cat.id" @click="goProductList(cat)">
          <view class="cat-icon-box">
            <i :class="'ri-' + categoryIconName(cat)" style="font-size:44rpx;color:#2979FF;" />
          </view>
          <text class="cat-name">{{ cat.name }}</text>
        </view>
      </view>
    </view>

    <!-- 分类为空的兜底：目录尚未配置也不留白 -->
    <view class="section" v-if="loaded && !categoryGroups.length">
      <view class="section-header">
        <text class="section-title">服务分类</text>
      </view>
      <view class="empty-card">
        <view class="empty-icon-box">
          <i class="ri-apps-2-line" style="font-size:56rpx;color:#2979FF;" />
        </view>
        <text class="empty-title">服务目录整理中</text>
        <text class="empty-desc">软件定制与电子代做均可接单，直接描述你的需求，团队评估后报价</text>
        <view class="empty-btn clickable" @click="goCustom">
          <i class="ri-edit-box-line" style="font-size:28rpx;" />
          <text>发布自定义需求</text>
        </view>
      </view>
    </view>

    <!-- 热门标准服务 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">
          <i class="ri-fire-line section-title-icon" style="color:#FF6D00;" />热门标准服务
        </text>
        <view class="section-more clickable" @click="goProductList()">
          <text>更多</text>
          <i class="ri-arrow-right-s-line" style="font-size:28rpx;" />
        </view>
      </view>
      <!-- v-show 而非 v-if：H5 桌面滚轮补丁在 onMounted 查询该节点，需常驻 DOM -->
      <scroll-view v-show="hotProducts.length" scroll-x class="product-scroll" :show-scrollbar="false" enhanced>
        <view class="product-scroll-inner">
          <view class="product-card hover-lift" v-for="product in hotProducts" :key="product.id" @click="goProductDetail(product)">
            <view class="product-img-wrap">
              <image v-if="product.cover" class="product-img" :src="product.cover" mode="aspectFill" />
              <view v-else class="product-img product-img--holder">
                <i :class="'ri-' + productIconName(product)" />
              </view>
              <view class="product-badge" v-if="product.tags && product.tags[0]">{{ product.tags[0] }}</view>
            </view>
            <view class="product-info">
              <text class="product-name">{{ product.title }}</text>
              <view class="product-bottom">
                <view class="product-price">
                  <text class="price-symbol">¥</text>
                  <text class="price-value">{{ fmtPrice(product.price) }}</text>
                  <text class="price-unit">起</text>
                </view>
                <text class="product-sold">{{ product.sold_count || 0 }}单</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
      <view class="empty-card" v-if="loaded && !hotProducts.length">
        <view class="empty-icon-box">
          <i class="ri-inbox-line" style="font-size:56rpx;color:#2979FF;" />
        </view>
        <text class="empty-title">标准服务上架中</text>
        <text class="empty-desc">没有现成的服务也没关系，把需求告诉团队，先评估再报价，确认后才开工</text>
        <view class="empty-btn clickable" @click="goCustom">
          <i class="ri-edit-box-line" style="font-size:28rpx;" />
          <text>发布自定义需求</text>
        </view>
      </view>
    </view>

    <!-- 客户评价精选 -->
    <view class="section" v-if="reviews.length">
      <view class="section-header">
        <text class="section-title">
          <i class="ri-star-smile-line section-title-icon" style="color:#FF9100;" />客户评价
        </text>
      </view>
      <view class="review-list">
        <view class="review-card" v-for="r in reviews" :key="r.id">
          <view class="review-head">
            <text class="review-name">{{ r.nickname }}</text>
            <view class="review-stars">
              <i v-for="s in 5" :key="s" class="ri-star-fill" style="font-size:22rpx;" :style="{ color: s <= r.score ? '#FF9100' : '#E0E0E0' }" />
            </view>
          </view>
          <text class="review-content">{{ r.content || '好评' }}</text>
          <text class="review-project">项目：{{ r.title }}</text>
        </view>
      </view>
    </view>

    <!-- 常见问题 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">常见问题</text>
      </view>
      <view class="faq-list">
        <view class="faq-card" v-for="f in faqs" :key="f.q">
          <view class="faq-q">
            <i class="ri-question-answer-line" style="font-size:30rpx;color:#2979FF;" />
            <text>{{ f.q }}</text>
          </view>
          <text class="faq-a">{{ f.a }}</text>
        </view>
      </view>
    </view>
    </template>

    <!-- 底部品牌收尾 -->
    <view class="page-foot">
      <text class="page-foot-brand">{{ brandName }} · 软件定制 / 电子代做</text>
      <text class="page-foot-slogan">需求评估免费，报价确认后才开工</text>
    </view>

    <!-- 底部安全区 -->
    <view class="safe-bottom" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
// #ifdef H5
import { onBeforeUnmount } from 'vue';
// #endif
import { onShow } from '@dcloudio/uni-app';
import { useCategoryStore } from '@/store/category.js';
import { useProductStore } from '@/store/product.js';
import { useAuthStore } from '@/store/auth.js';
import { api } from '@/api/request.js';
import { categoryIconName, productIconName, GUARANTEES, FAQS, DEFAULT_NOTICE } from '@/common/browse.js';
import {
  HOME_CONFIG_CACHE_KEY,
  sniffPageConfig,
  isValidPageConfig,
  normalizePageConfig,
  pickBrandName,
} from '@/common/page-config.js';
import ConfigBlocks from '@/components/page-config/config-blocks.vue';
// #ifdef H5
// 电脑版消费（P3）：判定与缓存键复用同一纯函数模块；PC 渲染器仅 H5 引入，不进小程序包
import { HOME_PC_CONFIG_CACHE_KEY, isDesktopViewport } from '@/common/page-config.js';
import ConfigBlocksPc from '@/components/page-config/config-blocks-pc.vue';
// #endif

const authStore = useAuthStore();
const categoryStore = useCategoryStore();
const productStore = useProductStore();

const statusBarHeight = ref(20);
const brandName = ref('定制接单');
const userAvatar = ref('');

// ==================== 装修配置消费（二期 C1 / U1+U3+U4） ====================

// 合法配置的归一化渲染态（{components, global}）；null = 走硬编码兜底
const pageConfig = ref(null);

// H5 且 URL query 含 preview=draft 时改拉草稿（手机宽 home-draft / 桌面视口 home-pc-draft，均不写缓存）
let draftPreview = false;
// #ifdef H5
try {
  draftPreview = /[?&]preview=draft(?=[&#]|$)/.test(window.location.href);
} catch (e) { /* 解析失败按非预览处理 */ }
// #endif
const isDraftPreview = draftPreview;

// 本地缓存首帧直出：上次合法的线上配置先渲染，onShow 后台刷新（草稿预览跳过）
if (!isDraftPreview) {
  try {
    const cached = uni.getStorageSync(HOME_CONFIG_CACHE_KEY);
    if (cached) {
      const cfg = sniffPageConfig(cached);
      if (isValidPageConfig(cfg)) pageConfig.value = normalizePageConfig(cfg);
    }
  } catch (e) { /* 缓存不可用则等待网络结果 */ }
}

// -------------------- 电脑版配置消费（P3 / T10，仅 H5 编译） --------------------

// #ifdef H5
// 电脑版（home-pc）归一化渲染态；null = 按回退链走手机配置响应式或硬编码兜底
const pcPageConfig = ref(null);
// 桌面视口（≥768，与 topWindow / $bp-tablet 对齐）标记；matchMedia change 驱动更新
const desktopViewport = ref(isDesktopViewport());
// home-pc 是否已请求过：跨 768 拉伸窗口进入桌面视口时懒拉缺失配置
let pcConfigRequested = false;

// PC 缓存首帧直出（与手机版缓存互相独立；草稿预览不读不写）
if (!isDraftPreview) {
  try {
    const cachedPc = uni.getStorageSync(HOME_PC_CONFIG_CACHE_KEY);
    if (cachedPc) {
      const cfg = sniffPageConfig(cachedPc);
      if (isValidPageConfig(cfg)) pcPageConfig.value = normalizePageConfig(cfg);
    }
  } catch (e) { /* 缓存不可用则等待网络结果 */ }
}
// #endif

// 电脑版分支是否生效：桌面视口且 home-pc 合法（回退链 5.4 第一环）；
// 小程序端 H5 段被条件编译剔除，恒 false，手机/小程序渲染路径零改动
const showPcBlocks = computed(() => {
  let on = false;
  // #ifdef H5
  on = !!(desktopViewport.value && pcPageConfig.value);
  // #endif
  return on;
});

// global 消费：pageTitle → 页面标题（H5 为 document.title）；导航配色见下方 computed；
// 电脑版分支生效时按 home-pc 的 global 取值（4.4）
const applyPageTitle = () => {
  let g = pageConfig.value && pageConfig.value.global;
  // #ifdef H5
  if (showPcBlocks.value) g = pcPageConfig.value.global;
  // #endif
  if (g && g.pageTitle) {
    try { uni.setNavigationBarTitle({ title: g.pageTitle }); } catch (e) { /* 忽略 */ }
  }
};

const fetchPageConfig = async () => {
  const key = isDraftPreview ? 'home-draft' : 'home';
  try {
    const raw = await api.get('/page-config/' + key);
    const cfg = sniffPageConfig(raw);
    if (isValidPageConfig(cfg)) {
      pageConfig.value = normalizePageConfig(cfg);
      applyPageTitle();
      if (!isDraftPreview) uni.setStorageSync(HOME_CONFIG_CACHE_KEY, raw);
    } else {
      // 配置缺失 / 旧形状 / 空 components：清缓存，渲染硬编码兜底
      pageConfig.value = null;
      if (!isDraftPreview) uni.removeStorageSync(HOME_CONFIG_CACHE_KEY);
    }
  } catch (e) {
    pageConfig.value = null;
    if (!isDraftPreview) {
      try { uni.removeStorageSync(HOME_CONFIG_CACHE_KEY); } catch (e2) { /* 忽略 */ }
    }
  }
};

// #ifdef H5
// 电脑版配置获取（P3 / T10）：仅桌面视口追加请求，与 home 并行；
// home-pc 缺失/不合法/失败 → 置 null 走回退链（home 响应式 → 硬编码），与现状逐像素一致
const fetchPcPageConfig = async () => {
  const key = isDraftPreview ? 'home-pc-draft' : 'home-pc';
  try {
    const raw = await api.get('/page-config/' + key);
    const cfg = sniffPageConfig(raw);
    if (isValidPageConfig(cfg)) {
      pcPageConfig.value = normalizePageConfig(cfg);
      applyPageTitle();
      if (!isDraftPreview) uni.setStorageSync(HOME_PC_CONFIG_CACHE_KEY, raw);
    } else {
      pcPageConfig.value = null;
      if (!isDraftPreview) uni.removeStorageSync(HOME_PC_CONFIG_CACHE_KEY);
    }
  } catch (e) {
    pcPageConfig.value = null;
    if (!isDraftPreview) {
      try { uni.removeStorageSync(HOME_PC_CONFIG_CACHE_KEY); } catch (e2) { /* 忽略 */ }
    }
  }
};
// #endif

// 导航 chrome 常驻，配置生效时吃 global 配色（宽屏下页内导航整体隐藏，不受影响）
const navBarStyle = computed(() => {
  const s = { paddingTop: statusBarHeight.value + 'px' };
  const g = pageConfig.value && pageConfig.value.global;
  if (g && g.navBgColor) s.background = g.navBgColor;
  return s;
});
const navTextStyle = computed(() => {
  const g = pageConfig.value && pageConfig.value.global;
  return g && g.navTextColor ? { color: g.navTextColor } : {};
});
const pageBgStyle = computed(() => {
  let g = pageConfig.value && pageConfig.value.global;
  // #ifdef H5
  // 电脑版分支生效时页面背景吃 home-pc 的 global.bgColor（4.4），铺满全宽
  if (showPcBlocks.value) g = pcPageConfig.value.global;
  // #endif
  return g && g.bgColor ? { background: g.bgColor } : {};
});

// ==================== 品牌名消费（二期 C1 / U6） ====================

const fetchBrand = async () => {
  try {
    const raw = await api.get('/page-config/settings');
    const name = pickBrandName(raw);
    if (name) brandName.value = name;
  } catch (e) { /* 失败回退「定制接单」 */ }
};

const categoryGroups = ref([]);
const hotProducts = ref([]);
const reviews = ref([]);
// 公告接口无数据时用流程说明兜底，避免公告条整块消失
const notice = ref({ text: DEFAULT_NOTICE });
// 首次数据返回前不渲染空态，避免加载闪烁
const loaded = ref(false);

const guarantees = GUARANTEES;
const faqs = FAQS;

const quickEntries = ref([
  { key: 'custom', icon: 'edit-box-line', label: '发布需求', bgColor: 'linear-gradient(135deg,#E3F2FD,#BBDEFB)', iconColor: '#1565C0' },
  { key: 'services', icon: 'file-list-3-line', label: '标准服务', bgColor: 'linear-gradient(135deg,#FFF3E0,#FFE0B2)', iconColor: '#E65100' },
  { key: 'join', icon: 'team-line', label: '加入我们', bgColor: 'linear-gradient(135deg,#E8F5E9,#C8E6C9)', iconColor: '#2E7D32' },
  { key: 'service', icon: 'customer-service-2-line', label: '客服', bgColor: 'linear-gradient(135deg,#F3E5F5,#E1BEE7)', iconColor: '#6A1B9A' },
]);

const fetchData = async () => {
  try {
    // 热门取 8 个：桌面 4 列栅格正好 2 行；评价取 6 条：桌面 3 列 2 行
    const [cats, hots, notices, revs] = await Promise.all([
      categoryStore.fetchAll().then(() => categoryStore.list),
      productStore.fetchHot(8).then(() => productStore.hotList),
      api.get('/cms/articles', { type: 'notice' }),
      api.get('/orders/reviews', { limit: 6 }).catch(() => []),
    ]);
    const list = cats || [];
    categoryGroups.value = [
      { key: 'software', title: '软件定制', items: list.filter(c => c.group === 'software') },
      { key: 'electronics', title: '电子代做', items: list.filter(c => c.group === 'electronics') },
    ].filter(g => g.items.length);
    hotProducts.value = hots || [];
    reviews.value = revs || [];
    if (notices && notices.length > 0) {
      notice.value = { text: notices[0].title };
    }
  } catch (e) {
    console.log('首页数据加载失败:', e);
  } finally {
    loaded.value = true;
  }
};

onShow(() => {
  if (authStore.userInfo) {
    userAvatar.value = authStore.userInfo.avatar || '';
  }
  // 配置请求 / 品牌名与既有数据请求并行，互不阻塞；
  // home 始终发出（兜底数据源），home-pc 仅桌面视口追加，两请求并行（5.4）
  fetchPageConfig();
  // #ifdef H5
  if (desktopViewport.value) {
    pcConfigRequested = true;
    fetchPcPageConfig();
  }
  // #endif
  fetchBrand();
  fetchData();
});

// #ifdef H5
// 桌面浏览器预览时，让鼠标滚轮可以横向滚动热门服务。
// 挂在页面根节点做事件委托：配置版 ↔ 兜底版切换后热门区重新出现时依然生效。
onMounted(() => {
  const root = document.querySelector('.page-index');
  if (!root) return;
  root.addEventListener(
    'wheel',
    (e) => {
      if (!e.deltaY) return;
      const host = e.target && e.target.closest ? e.target.closest('.product-scroll') : null;
      if (!host) return;
      const scroller = Array.from(host.querySelectorAll('div')).find(
        (d) => d.scrollWidth > d.clientWidth + 1
      );
      if (scroller) {
        e.preventDefault();
        scroller.scrollLeft += e.deltaY;
      }
    },
    { passive: false }
  );
});

// 视口跨 768 变化（拉伸窗口）：matchMedia change 切换渲染分支；
// 首次进入桌面视口且尚未拉过 home-pc 时懒拉配置（P3 / T10）
let desktopMql = null;
const onDesktopMqlChange = () => {
  desktopViewport.value = isDesktopViewport();
  if (desktopViewport.value && !pcConfigRequested) {
    pcConfigRequested = true;
    fetchPcPageConfig();
  }
  applyPageTitle();
};
onMounted(() => {
  try {
    desktopMql = window.matchMedia('(min-width: 768px)');
    if (desktopMql.addEventListener) desktopMql.addEventListener('change', onDesktopMqlChange);
    else if (desktopMql.addListener) desktopMql.addListener(onDesktopMqlChange);
  } catch (e) { /* matchMedia 不可用则维持初始分支 */ }
});
onBeforeUnmount(() => {
  if (!desktopMql) return;
  if (desktopMql.removeEventListener) desktopMql.removeEventListener('change', onDesktopMqlChange);
  else if (desktopMql.removeListener) desktopMql.removeListener(onDesktopMqlChange);
  desktopMql = null;
});
// #endif

// 价格分转元
const fmtPrice = (fen) => {
  const yuan = (fen || 0) / 100;
  return yuan % 1 === 0 ? String(yuan) : yuan.toFixed(2);
};

// 导航
const goMy = () => uni.switchTab({ url: '/pages/my/index' });
const onEntry = (item) => {
  if (item.key === 'custom') uni.navigateTo({ url: '/subpkg/order/create-custom' });
  else if (item.key === 'services') uni.navigateTo({ url: '/subpkg/category/index' });
  else if (item.key === 'join') uni.navigateTo({ url: '/subpkg/my/join-us' });
  else uni.navigateTo({ url: '/subpkg/my/about' });
};
const goCategory = () => uni.navigateTo({ url: '/subpkg/category/index' });
const goCustom = () => uni.navigateTo({ url: '/subpkg/order/create-custom' });
const goProductList = (cat) => {
  const query = cat ? '?categoryId=' + cat.id + '&categoryName=' + cat.name : '';
  uni.navigateTo({ url: '/subpkg/product/list' + query });
};
const goProductDetail = (product) => uni.navigateTo({ url: '/subpkg/product/detail?id=' + product.id });
</script>

<style lang="scss" scoped>
.page-index {
  min-height: 100vh;
  background: #F5F6FA;
}

/* 导航栏 */
.nav-bar {
  background: linear-gradient(135deg, #2979FF 0%, #4A90D9 100%);
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-content {
  display: flex;
  align-items: center;
  padding: 20rpx 28rpx;
  gap: 20rpx;
}
.nav-brand {
  flex-shrink: 0;
}
.brand-name {
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
}
.nav-search {
  flex: 1;
  display: flex;
  align-items: center;
  height: 68rpx;
  border-radius: 34rpx;
  padding: 0 28rpx;
  gap: 12rpx;
  background: rgba(255,255,255,0.9);
}
/* 配置版导航吃 global 配色（默认白底）时，搜索框改中性底色保证可见 */
.nav-search--flat {
  background: #F5F6FA;
}
.search-placeholder {
  color: #999;
  font-size: 24rpx;
}
.nav-avatar {
  flex-shrink: 0;
}
.avatar-img {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(255,255,255,0.4);
  background: #eee;
  display: block;
}

/* 品牌横幅 */
.hero-card {
  margin: 24rpx 24rpx 0;
  padding: 36rpx 32rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #2979FF, #1565C0);
  box-shadow: 0 8rpx 30rpx rgba(41,121,255,0.2);
}
.hero-title {
  color: #fff;
  font-size: 40rpx;
  font-weight: 700;
  display: block;
}
.hero-sub {
  color: rgba(255,255,255,0.8);
  font-size: 24rpx;
  display: block;
  margin-top: 12rpx;
}
.hero-steps {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 24rpx;
  flex-wrap: wrap;
}
.hero-step {
  background: rgba(255,255,255,0.18);
  color: #fff;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}
.hero-arrow {
  color: rgba(255,255,255,0.6);
  font-size: 22rpx;
}

/* 快捷入口 */
.quick-entries {
  display: flex;
  justify-content: space-between;
  padding: 30rpx 24rpx;
  gap: 16rpx;
}
.qe-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
  cursor: pointer;
}
.qe-icon-box {
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.08);
  transition: transform 0.2s;
}
.qe-card:active .qe-icon-box {
  transform: scale(0.92);
}
.qe-label {
  font-size: 24rpx;
  color: #333;
  font-weight: 500;
}

/* 公告 */
.notice-bar {
  display: flex;
  align-items: center;
  margin: 10rpx 24rpx;
  padding: 20rpx 24rpx;
  background: linear-gradient(135deg, #FFF8E1, #FFF3E0);
  border-radius: 16rpx;
  gap: 16rpx;
}
.notice-icon-box {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #FFF3E0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.notice-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
  overflow: hidden;
}
.notice-tag {
  font-size: 20rpx;
  color: #FF9100;
  background: #FFE0B2;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  font-weight: 600;
  flex-shrink: 0;
}
.notice-text {
  font-size: 24rpx;
  color: #E65100;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 服务保障 */
.guarantee-bar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin: 24rpx 24rpx 0;
}
.g-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 22rpx 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}
.g-icon-box {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  background: #E3F2FD;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.g-texts {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.g-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #1A1A2E;
}
.g-desc {
  font-size: 22rpx;
  color: #999;
  line-height: 1.5;
}

/* 空态卡片（分类/热门服务无数据时） */
.empty-card {
  margin: 0 24rpx;
  padding: 48rpx 32rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.empty-icon-box {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-title {
  margin-top: 20rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #1A1A2E;
}
.empty-desc {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #999;
  line-height: 1.6;
  max-width: 560rpx;
}
.empty-btn {
  margin-top: 28rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: linear-gradient(135deg, #2979FF, #1565C0);
  color: #fff;
  font-size: 26rpx;
  font-weight: 600;
  padding: 16rpx 40rpx;
  border-radius: 40rpx;
}

/* 通用区块 */
.section {
  margin: 36rpx 0 0;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24rpx;
  margin-bottom: 20rpx;
}
.section-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1A1A2E;
}
.section-title-icon {
  margin-right: 8rpx;
  font-size: 32rpx;
  vertical-align: -2rpx;
}
.section-more {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: 26rpx;
  color: #999;
}

/* 分类网格 */
.category-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0 16rpx;
}
.category-item {
  width: 20%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 0 24rpx;
  gap: 12rpx;
}
.cat-icon-box {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.cat-name {
  font-size: 22rpx;
  color: #333;
  font-weight: 500;
}

/* 商品横向滚动 */
.product-scroll {
  width: 100%;
}
/* #ifdef H5 */
.product-scroll :deep(.uni-scroll-view::-webkit-scrollbar) {
  display: block;
  height: 8rpx;
}
.product-scroll :deep(.uni-scroll-view::-webkit-scrollbar-thumb) {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 4rpx;
}
/* #endif */
.product-scroll-inner {
  display: flex;
  width: max-content;
  padding: 4rpx 24rpx 16rpx;
}
.product-card {
  width: 340rpx;
  flex-shrink: 0;
  margin-right: 20rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);
}
.product-card:last-child {
  margin-right: 0;
}
.product-img-wrap {
  position: relative;
}
.product-img {
  width: 100%;
  height: 220rpx;
  display: block;
  background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
}
/* 无封面时用分类图标占位，避免整块空白 */
.product-img--holder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72rpx;
  color: rgba(41, 121, 255, 0.45);
}
.product-badge {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  background: linear-gradient(135deg, #FF6D00, #FF9100);
  color: #fff;
  font-size: 20rpx;
  padding: 6rpx 14rpx;
  border-radius: 6rpx;
  font-weight: 600;
}
.product-info {
  padding: 20rpx 24rpx 24rpx;
}
.product-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1A1A2E;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  white-space: normal;
  margin-bottom: 16rpx;
}
.product-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.price-symbol {
  color: #FF3D00;
  font-size: 24rpx;
  font-weight: 700;
}
.price-value {
  color: #FF3D00;
  font-size: 38rpx;
  font-weight: 700;
}
.price-unit {
  color: #999;
  font-size: 20rpx;
}
.product-sold {
  font-size: 22rpx;
  color: #999;
}

/* 评价 */
.review-list {
  padding: 0 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.review-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);
}
.review-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.review-name {
  font-size: 26rpx;
  font-weight: 600;
}
.review-stars {
  display: flex;
  gap: 4rpx;
}
.review-content {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #444;
  line-height: 1.6;
}
.review-project {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #999;
}

/* 常见问题 */
.faq-list {
  padding: 0 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.faq-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 26rpx 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);
}
.faq-q {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #1A1A2E;
}
.faq-a {
  display: block;
  margin-top: 14rpx;
  font-size: 24rpx;
  color: #666;
  line-height: 1.7;
}

/* 底部品牌收尾 */
.page-foot {
  margin-top: 44rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.page-foot-brand {
  font-size: 24rpx;
  color: #999;
  font-weight: 600;
}
.page-foot-slogan {
  font-size: 22rpx;
  color: #bbb;
}

.safe-bottom {
  height: calc(120rpx + env(safe-area-inset-bottom));
}

/* #ifdef H5 */
/* 草稿预览角标（仅 H5 出现）：贴右侧悬浮，不遮挡导航与 tabBar */
.draft-badge {
  position: fixed;
  right: 0;
  top: 30%;
  z-index: 999;
  background: linear-gradient(135deg, #FF6D00, #FF9100);
  color: #fff;
  font-size: 22rpx;
  font-weight: 600;
  padding: 10rpx 16rpx 10rpx 20rpx;
  border-radius: 28rpx 0 0 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 109, 0, 0.35);
  letter-spacing: 2rpx;
}

/* ==================== 桌面适配（B1–B3，仅 H5 编译，不进小程序包） ==================== */

/* B1：内容限宽 1200px 居中（页面背景与 page 同色，视觉上铺满全宽） */
.page-index {
  @include content-limit($content-max-page);
}

@include screen-tablet-up {
  /* B1：宽屏下导航职责移交 topWindow 顶栏，整体隐藏页内自定义导航栏
     （display:none 连同 sticky 占位与 statusBarHeight 内联留白一并消除） */
  .nav-bar {
    display: none;
  }

  /* B1：hero 横幅与快捷入口同一行（约 60% / 40%），其余区块通栏 */
  .page-index {
    display: grid;
    grid-template-columns: minmax(0, 6fr) minmax(0, 4fr);
    column-gap: 24px;
    align-content: start;
    padding: 0 24px;
  }
  .page-index > * {
    grid-column: 1 / -1;
    min-width: 0;
  }
  .hero-card {
    grid-column: 1;
    margin: 20px 0 0;
  }
  .quick-entries {
    grid-column: 2;
    margin: 20px 0 0;
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    align-items: center;
    align-content: center;
    /* 兜底：小屏幕（screen ≤960 时 rpx 按屏宽换算）图标偏大时允许折行为 2x2，避免溢出裁切 */
    flex-wrap: wrap;
    row-gap: 12px;
  }
  .notice-bar {
    margin: 16px 0 0;
  }

  /* 服务保障：宽屏一行四项成信任条 */
  .guarantee-bar {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin: 16px 0 0;
  }
  .g-item {
    padding: 14px 16px;
  }

  /* 页面已有 24px 侧边距，区块内部左右留白归零对齐 */
  .section-header {
    padding: 0;
  }
  .category-grid {
    padding: 0;
  }
  .review-list {
    padding: 0;
  }
  .faq-list {
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .faq-card {
    margin: 0;
  }
  .empty-card {
    margin: 0;
    padding: 40px 24px;
  }
  .page-foot {
    margin-top: 32px;
  }

  /* B3：分类宫格宽屏改列数（8 列），避免图标间距过大（改列数不改结构） */
  .category-item {
    width: 12.5%;
  }

  /* B2：768–1199px 热门区保持横向滚动，仅左右边距与区块对齐 */
  .product-scroll-inner {
    padding: 4px 0 12px;
  }

  /* B3：客户评价宽屏卡片栅格（平板 2 列） */
  .review-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  /* 宽屏无底部 tabBar，压缩底部占位 */
  .safe-bottom {
    height: 32px;
  }
}

@include screen-desktop-up {
  /* B2：≥1200px 热门标准服务由横滚改为 4 列栅格（仅 CSS，不改数据逻辑；
     无横向溢出时页内滚轮补丁自动失效，滚轮恢复纵向滚动页面） */
  .product-scroll-inner {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    width: auto;
  }
  .product-card {
    width: auto;
    margin-right: 0;
  }
  .product-img {
    height: 150px;
  }

  /* B3：客户评价 3 列、分类宫格 10 列 */
  .review-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .category-item {
    width: 10%;
  }
}
/* #endif */
</style>
