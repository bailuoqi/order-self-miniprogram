import { defineStore } from "pinia";
import { api } from "@/api/request.js";

export const useChatStore = defineStore("chat", {
  state: () => ({
    sessions: [],
    messages: [],
    currentSession: null,
  }),
  actions: {
    async fetchSessions() {
      this.sessions = await api.get("/chat/sessions");
    },
    /** 按订单获取/创建会话（客户 ↔ 团队，用于报价商议） */
    async openOrderSession(orderId) {
      this.currentSession = await api.post("/chat/order-session", { order_id: orderId });
      return this.currentSession;
    },
    async fetchMessages(sessionId, page = 1) {
      const res = await api.get(`/chat/messages/${sessionId}`, { page });
      this.messages = res.list;
    },
    async sendMessage(sessionId, content) {
      const msg = await api.post(`/chat/messages/${sessionId}`, { content });
      this.messages.push(msg);
      return msg;
    },
    async markRead(sessionId) {
      await api.post(`/chat/read/${sessionId}`);
    },
  },
});
