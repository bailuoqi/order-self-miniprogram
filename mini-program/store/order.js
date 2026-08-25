import { defineStore } from "pinia";
import { api } from "@/api/request.js";

/** 订单状态文案（唯一流程：下单→报价→敲定→定金→制作→交付→尾款→评价） */
export const ORDER_STATUS_MAP = {
  pending_quote: "待报价",
  quoting: "报价商议中",
  confirmed: "待付定金",
  deposit_paid: "制作中",
  delivered: "待付尾款",
  final_paid: "待评价",
  completed: "已完成",
  cancelled: "已取消",
  refunding: "退款中",
  refunded: "已退款",
};

export const ORDER_STATUS_COLOR = {
  pending_quote: "#FF9100",
  quoting: "#FF9100",
  confirmed: "#FF3D00",
  deposit_paid: "#2979FF",
  delivered: "#FF3D00",
  final_paid: "#FF9100",
  completed: "#00C853",
  cancelled: "#999999",
  refunding: "#FF3D00",
  refunded: "#999999",
};

export const useOrderStore = defineStore("order", {
  state: () => ({
    myOrders: { list: [], total: 0, page: 1, pageSize: 10 },
    currentOrder: null,
  }),
  actions: {
    async fetchMyOrders(status, append = false) {
      if (!append) this.myOrders.page = 1;
      const { page, pageSize } = this.myOrders;
      const res = await api.get("/orders/my", { status: status || undefined, page, pageSize });
      if (append) {
        this.myOrders.list = [...this.myOrders.list, ...(res.list || [])];
        this.myOrders.total = res.total;
      } else {
        this.myOrders = { list: res.list || [], total: res.total, page, pageSize };
      }
    },
    async loadMoreOrders(status) {
      this.myOrders.page++;
      await this.fetchMyOrders(status, true);
    },
    /** 从标准服务下单（下单后进入待报价） */
    async createOrder(data) {
      return api.post("/orders", data);
    },
    /** 发布自定义需求 */
    async createCustomOrder(data) {
      return api.post("/orders/custom", data);
    },
    async fetchDetail(id) {
      this.currentOrder = await api.get(`/orders/${id}`);
      return this.currentOrder;
    },
    /** 确认报价，敲定订单 */
    async confirmQuote(orderId) {
      this.currentOrder = await api.post(`/orders/${orderId}/confirm-quote`);
      return this.currentOrder;
    },
    /** 评价 */
    async review(orderId, data) {
      this.currentOrder = await api.post(`/orders/${orderId}/review`, data);
      return this.currentOrder;
    },
    /** 取消订单 */
    async cancelOrder(orderId, reason) {
      this.currentOrder = await api.post(`/orders/${orderId}/cancel`, { reason });
      return this.currentOrder;
    },
  },
});
