<!--
  宽屏顶栏（任务 A3，规划书 §2）：仅由 pages.json 的 topWindow 配置在 H5 ≥768px 时加载，
  天然不进小程序包。品牌 + 六个导航项 + 头像/登录入口；当前链路高亮。
  桌面专属组件，尺寸一律用 px。
-->
<template>
  <view class="top-window">
    <view class="tw-inner">
      <view class="tw-brand" @click="go(navs[0])">
        <text class="tw-brand-name">定制接单</text>
      </view>
      <view class="tw-nav">
        <view
          v-for="item in navs"
          :key="item.key"
          class="tw-nav-item"
          :class="{ 'tw-nav-item--active': activeKey === item.key }"
          @click="go(item)"
        >
          <text>{{ item.title }}</text>
        </view>
      </view>
      <view class="tw-user" @click="goMy">
        <image class="tw-avatar" :src="avatar" mode="aspectFill" />
        <text class="tw-user-name">{{ displayName }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { useAuthStore } from "@/store/auth.js";

const NAVS = [
  { key: "home", title: "首页", url: "/pages/index/index", isTab: true },
  { key: "category", title: "服务分类", url: "/subpkg/category/index", isTab: false },
  { key: "product", title: "标准服务", url: "/subpkg/product/list", isTab: false },
  { key: "publish", title: "发布需求", url: "/subpkg/order/create-custom", isTab: false },
  { key: "order", title: "我的订单", url: "/pages/order/list", isTab: true },
  { key: "message", title: "消息", url: "/pages/message/message", isTab: true },
];

// 页面路径前缀 → 高亮导航 key（子包页归属其所属链路；顺序即匹配优先级）
const ACTIVE_RULES = [
  ["pages/index/index", "home"],
  ["subpkg/category/", "category"],
  ["subpkg/product/", "product"],
  ["subpkg/order/create-custom", "publish"],
  ["subpkg/order/", "order"],
  ["pages/order/list", "order"],
  ["pages/message/message", "message"],
  ["subpkg/chat/", "message"],
];

export default {
  name: "TopWindow",
  data() {
    return {
      navs: NAVS,
      activeKey: "home",
      currentPagePath: "",
    };
  },
  computed: {
    authStore() {
      return useAuthStore();
    },
    isLogin() {
      return this.authStore.isLogin;
    },
    avatar() {
      return (this.authStore.userInfo && this.authStore.userInfo.avatar) || "/static/icons/default-avatar.png";
    },
    displayName() {
      if (!this.isLogin) return "登录";
      return (this.authStore.userInfo && this.authStore.userInfo.nickname) || "已登录";
    },
  },
  watch: {
    // H5 window 组件内可直接访问 $route；meta.route 即页面路径（如 pages/index/index），
    // 与 uni-h5 内置 tabBar 的高亮判断口径一致。
    $route: {
      immediate: true,
      handler(route) {
        this.currentPagePath = (route && route.meta && route.meta.route) || "";
        const hit = ACTIVE_RULES.find(([prefix]) => this.currentPagePath.indexOf(prefix) === 0);
        this.activeKey = hit ? hit[1] : "";
      },
    },
  },
  methods: {
    go(item) {
      if (this.currentPagePath === item.url.slice(1)) return;
      if (item.isTab) {
        uni.switchTab({ url: item.url });
      } else {
        uni.navigateTo({ url: item.url });
      }
    },
    goMy() {
      uni.switchTab({ url: "/pages/my/index" });
    },
  },
};
</script>

<style lang="scss" scoped>
// 顶栏在 uni-page 之外，App.vue 里挂在 page 上的 CSS 变量不可用，颜色直接取值。
.top-window {
  height: $top-window-height;
  background: #ffffff;
  border-bottom: 1px solid #eeeeee;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.tw-inner {
  display: flex;
  align-items: center;
  height: 100%;
  max-width: $content-max-page;
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
}

.tw-brand {
  display: flex;
  align-items: center;
  margin-right: 32px;
  cursor: pointer;
  flex-shrink: 0;
}

.tw-brand-name {
  font-size: 20px;
  font-weight: 700;
  color: #2979ff;
  letter-spacing: 1px;
}

.tw-nav {
  display: flex;
  align-items: center;
  height: 100%;
  flex: 1;
  min-width: 0;
}

.tw-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 18px;
  font-size: 15px;
  color: #666666;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s ease;

  &:hover {
    color: #2979ff;
  }

  &--active {
    color: #2979ff;
    font-weight: 600;

    &::after {
      content: "";
      position: absolute;
      left: 18px;
      right: 18px;
      bottom: 0;
      height: 3px;
      border-radius: 2px;
      background: #2979ff;
    }
  }
}

.tw-user {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 16px;
  padding: 4px 12px 4px 4px;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: #f5f6fa;
  }
}

.tw-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #eeeeee;
  flex-shrink: 0;
}

.tw-user-name {
  margin-left: 8px;
  font-size: 14px;
  color: #1a1a2e;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 768–1199px 档：导航更紧凑，避免六项导航在小桌面/平板上溢出
@media (max-width: 1199px) {
  .tw-inner {
    padding: 0 16px;
  }

  .tw-brand {
    margin-right: 16px;
  }

  .tw-nav-item {
    padding: 0 10px;
    font-size: 14px;

    &--active::after {
      left: 10px;
      right: 10px;
    }
  }

  .tw-user-name {
    display: none;
  }
}
</style>
