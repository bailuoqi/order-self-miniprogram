<script setup>
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useAuthStore } from "@/store/auth.js";

onLaunch(() => {
  console.log("App Launch");
  // 尝试自动登录
  tryAutoLogin();
  // #ifdef H5
  setupDesktopTabBar();
  // #endif
});

onShow(() => { console.log("App Show"); });
onHide(() => { console.log("App Hide"); });

const tryAutoLogin = async () => {
  const token = uni.getStorageSync("token");
  if (token) return; // 已登录

  const authStore = useAuthStore();

  // #ifdef H5
  // H5 预览环境：使用开发登录（后端生产环境禁用该接口）
  try {
    await authStore.devLogin();
    console.log("H5 开发登录成功");
  } catch (e) {
    console.log("H5 开发登录失败:", e);
  }
  return;
  // #endif

  // #ifndef H5
  try {
    // 微信小程序环境：调用 uni.login 获取 code
    const loginRes = await uni.login({ provider: "weixin" });
    if (loginRes.code) {
      await authStore.wxLogin(loginRes.code);
      console.log("自动登录成功");
    }
  } catch (e) {
    console.log("自动登录失败，可手动触发:", e);
    // 开发环境：静默失败，允许未登录浏览
  }
  // #endif
};

// #ifdef H5
// 宽屏（≥768px，与 responsive.scss 的 $bp-tablet、topWindow.matchMedia 对齐）隐藏底部
// tabBar、窄屏恢复。以下方样式里的 CSS 媒体查询为主，这里调用 uni.hideTabBar/showTabBar
// 同步 uni 内部状态（--window-bottom 等），窗口动态拖拽变宽变窄时双保险。
const setupDesktopTabBar = () => {
  const mediaQuery = window.matchMedia("(min-width: 768px)");
  // onLaunch 早于 Tab 页挂载、switchTab 的 complete 也早于目标页就绪，
  // 此时 hideTabBar 会以 fail 返回（not TabBar page），故失败后限次重试；
  // 非 Tab 页上恒失败，重试耗尽即停，由 App.vue 样式端的
  // --window-bottom / --tab-bar-height 归零规则最终兜底。
  let hideRetry = 0;
  const applyTabBarVisible = () => {
    if (mediaQuery.matches) {
      uni.hideTabBar({
        animation: false,
        success: () => { hideRetry = 0; },
        fail: () => {
          if (hideRetry < 5) {
            hideRetry += 1;
            setTimeout(applyTabBarVisible, 200);
          }
        },
      });
    } else {
      uni.showTabBar({ animation: false, fail: () => {} });
    }
  };
  const triggerApply = () => {
    hideRetry = 0;
    applyTabBarVisible();
  };
  triggerApply();
  uni.addInterceptor("switchTab", {
    complete: () => setTimeout(triggerApply, 50),
  });
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", triggerApply);
  } else if (typeof mediaQuery.addListener === "function") {
    // 兼容不支持 addEventListener 的旧浏览器
    mediaQuery.addListener(triggerApply);
  }
};
// #endif
</script>

<style lang="scss">
/* 断点变量与桌面适配混入（common/responsive.scss）已经由 uni.scss 全局注入，
   本文件及各页 <style lang="scss"> 可直接使用 $bp-tablet 等变量与混入 */
@import "@/static/fonts/remixicon-trimmed.css";

page {
  --primary: #2979FF;
  --primary-light: #E3F2FD;
  --primary-dark: #1565C0;
  --success: #00C853;
  --warning: #FF9100;
  --danger: #FF3D00;
  --info: #909399;
  --text-main: #1A1A2E;
  --text-secondary: #666666;
  --text-light: #999999;
  --bg-page: #F5F6FA;
  --bg-card: #FFFFFF;
  --border: #EEEEEE;
  --radius: 16rpx;
  --shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
  
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  font-size: 28rpx;
  color: var(--text-main);
  background-color: var(--bg-page);
  box-sizing: border-box;
}

[class^="ri-"], [class*=" ri-"] { line-height: 1; vertical-align: middle; }

.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-center { display: flex; align-items: center; justify-content: center; }
.flex-between { display: flex; align-items: center; justify-content: space-between; }
.flex-1 { flex: 1; }
.text-center { text-align: center; }
.text-primary { color: var(--primary); }
.text-secondary { color: var(--text-secondary); }
.text-light { color: var(--text-light); }
.font-12 { font-size: 24rpx; }
.font-14 { font-size: 28rpx; }
.font-bold { font-weight: 700; }
.mt-20 { margin-top: 20rpx; }
.p-30 { padding: 30rpx; }
.rounded { border-radius: var(--radius); }
.bg-white { background: var(--bg-card); }
.card { background: var(--bg-card); border-radius: var(--radius); padding: 30rpx; box-shadow: var(--shadow); }

/* #ifdef H5 */
/* ==================== 桌面适配 · 全局壳（仅 H5 编译，不进小程序包） ==================== */

/* 内容限宽变量：供各页媒体查询引用，与 common/responsive.scss 的 SCSS 变量一一对应 */
page {
  --content-max-page: 1200px;
  --content-max-form: 760px;
  --content-max-chat: 960px;
  --content-max-pay: 560px;
}

/* A4：宽屏隐藏底部 tabBar（uni-tabbar 元素含 tab 条与占位符）。
   脚本里的 matchMedia 监听调用 uni.hideTabBar/showTabBar 同步 --window-bottom，互为兜底。 */
@media (min-width: $bp-tablet) {
  uni-tabbar.uni-tabbar-bottom {
    display: none !important;
  }

  /* uni.hideTabBar 在 onLaunch/直达子包页时可能未生效，Tab 页会残留 50px 底部占位：
     uni-page 的 --window-bottom 与 uni-page-wrapper 的 --tab-bar-height（wrapper 高度
     按其扣减、::after 以其垫底，页面凭空高 50px 出现空滚动）。宽屏下无底部 tabBar，
     两个变量一并强制归零，与上面的 tabBar 隐藏同为双保险 */
  uni-page {
    --window-bottom: 0px !important;
  }

  uni-page-wrapper {
    --tab-bar-height: 0px !important;
  }
}

/* A5：桌面指针与 hover 反馈，仅在支持 hover 的精确指针设备（鼠标）生效 */
@media (hover: hover) and (pointer: fine) {
  uni-button,
  uni-navigator,
  uni-label,
  uni-checkbox,
  uni-radio,
  uni-switch,
  uni-picker,
  .clickable {
    cursor: pointer;
  }

  uni-button:hover,
  .clickable:hover {
    opacity: 0.88;
  }

  /* 供各页给卡片/条目在模板上追加 class 使用的悬停反馈（模板只允许加 class 不动逻辑） */
  .hover-lift {
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
}
/* #endif */
</style>