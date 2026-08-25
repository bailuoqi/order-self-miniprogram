import { Injectable } from "@nestjs/common";
import { BizException } from "../../common/exceptions/biz.exception";
import { ErrorCode } from "../../common/exceptions/error-codes";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Order, OrderStatus, OrderSource } from "./order.entity";
import { OrderLog } from "./order-log.entity";
import { OrderQuote } from "./order-quote.entity";
import { Product } from "../product/product.entity";
import { v4 as uuid } from "uuid";

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderLog) private logRepo: Repository<OrderLog>,
    @InjectRepository(OrderQuote) private quoteRepo: Repository<OrderQuote>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  /** Admin: 所有订单列表 */
  async findAll(query?: { status?: string; source?: string; keyword?: string; page?: number; pageSize?: number }) {
    const { status, source, keyword, page = 1, pageSize = 20 } = query || {};
    const qb = this.orderRepo.createQueryBuilder("o")
      .leftJoinAndSelect("o.product", "p")
      .leftJoinAndSelect("o.category", "c")
      .leftJoinAndSelect("o.user", "u");

    if (status) qb.andWhere("o.status = :st", { st: status });
    if (source) qb.andWhere("o.source = :src", { src: source });
    if (keyword) qb.andWhere("(o.order_no LIKE :kw OR o.title LIKE :kw)", { kw: `%${keyword}%` });
    qb.orderBy("o.created_at", "DESC")
      .skip((+page - 1) * +pageSize)
      .take(+pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total, page: +page, pageSize: +pageSize };
  }

  /** 用户: 从标准服务下单（下单后进入待报价，不直接成交） */
  async createFromProduct(userId: number, dto: {
    product_id: number; requirement?: string; contact?: string;
    expected_days?: string; attachments?: string[];
  }) {
    const product = await this.productRepo.findOne({ where: { id: dto.product_id } });
    if (!product || product.status !== 1) throw new BizException(ErrorCode.PRODUCT_OFFLINE);
    const data: Partial<Order> = {
      order_no: this.genNo(),
      user_id: userId,
      source: OrderSource.PRODUCT,
      product_id: product.id,
      category_id: product.category_id,
      title: product.title,
      requirement: dto.requirement || "",
      contact: dto.contact || "",
      expected_days: dto.expected_days || product.delivery_days || "",
      attachments: dto.attachments || [],
      status: OrderStatus.PENDING_QUOTE,
    };
    const saved = await this.orderRepo.save(data as any);
    await this.logRepo.save({ order_id: saved.id, action: "create", description: "客户从标准服务下单，等待团队报价" });
    return this.findOne(saved.id);
  }

  /** 用户: 发布自定义需求下单 */
  async createCustom(userId: number, dto: {
    category_id?: number; title: string; requirement: string; contact: string;
    expected_days?: string; attachments?: string[];
  }) {
    if (!dto.title || !dto.requirement || !dto.contact) {
      throw new BizException(ErrorCode.PARAM_INVALID);
    }
    const data: Partial<Order> = {
      order_no: this.genNo(),
      user_id: userId,
      source: OrderSource.CUSTOM,
      category_id: dto.category_id || null as any,
      title: dto.title,
      requirement: dto.requirement,
      contact: dto.contact,
      expected_days: dto.expected_days || "",
      attachments: dto.attachments || [],
      status: OrderStatus.PENDING_QUOTE,
    };
    const saved = await this.orderRepo.save(data as any);
    await this.logRepo.save({ order_id: saved.id, action: "create", description: "客户发布自定义需求，等待团队报价" });
    return this.findOne(saved.id);
  }

  async findOne(id: number) {
    const order = await this.orderRepo.findOne({
      where: { id }, relations: ["product", "category", "user", "logs", "quotes"] as any,
      order: { quotes: { created_at: "ASC" } } as any,
    });
    if (!order) throw new BizException(ErrorCode.ORDER_NOT_FOUND);
    return order;
  }

  async findByUser(userId: number, status?: string, page = 1, pageSize = 10) {
    const qb = this.orderRepo.createQueryBuilder("o")
      .leftJoinAndSelect("o.product", "p")
      .leftJoinAndSelect("o.category", "c")
      .where("o.user_id = :uid", { uid: userId });
    if (status) {
      const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
      qb.andWhere("o.status IN (:...sts)", { sts: statuses });
    }
    qb.orderBy("o.created_at", "DESC").skip((+page - 1) * +pageSize).take(+pageSize);
    const [list, total] = await qb.getManyAndCount();
    return { list, total, page: +page, pageSize: +pageSize };
  }

  /** Admin: 填写/修改报价（可多轮） */
  async quote(orderId: number, dto: { amount: number; deposit_amount: number; days?: string; note?: string }, adminName?: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new BizException(ErrorCode.ORDER_NOT_FOUND);
    if (![OrderStatus.PENDING_QUOTE, OrderStatus.QUOTING].includes(order.status)) {
      throw new BizException(ErrorCode.ORDER_STATUS_ERR, 400);
    }
    const amount = Math.round(+dto.amount);
    const deposit = Math.round(+dto.deposit_amount);
    if (!amount || amount <= 0 || deposit < 0 || deposit > amount) {
      throw new BizException(ErrorCode.ORDER_PRICE_ERR, 400);
    }
    const final = amount - deposit;

    await this.quoteRepo.save({
      order_id: orderId, amount, deposit_amount: deposit, final_amount: final,
      days: dto.days || "", note: dto.note || "", created_by: adminName || "团队",
    });

    order.quote_amount = amount;
    order.deposit_amount = deposit;
    order.final_amount = final;
    order.quote_days = dto.days || "";
    order.quote_note = dto.note || "";
    order.quoted_at = new Date();
    order.status = OrderStatus.QUOTING;
    await this.orderRepo.save(order);
    await this.logRepo.save({
      order_id: orderId, action: "quote", operator: adminName || "团队",
      description: `团队报价：总价 ${(amount / 100).toFixed(2)} 元，定金 ${(deposit / 100).toFixed(2)} 元，工期 ${dto.days || "-"}`,
    });
    return this.findOne(orderId);
  }

  /** 用户: 确认报价，敲定订单 */
  async confirmQuote(orderId: number, userId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, user_id: userId } });
    if (!order) throw new BizException(ErrorCode.ORDER_NOT_FOUND);
    if (order.status !== OrderStatus.QUOTING || !order.quote_amount) {
      throw new BizException(ErrorCode.ORDER_STATUS_ERR, 400);
    }
    order.status = OrderStatus.CONFIRMED;
    order.quote_confirmed_at = new Date();
    await this.orderRepo.save(order);
    await this.quoteRepo.update(
      { order_id: orderId, amount: order.quote_amount, deposit_amount: order.deposit_amount },
      { is_confirmed: 1 },
    );
    await this.logRepo.save({ order_id: orderId, action: "confirm_quote", description: "客户确认报价，订单敲定，等待支付定金" });
    return this.findOne(orderId);
  }

  /** 支付成功后的状态推进（由 PaymentService 调用） */
  async onPaymentSuccess(orderId: number, stage: "deposit" | "final", wxTransactionId?: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new BizException(ErrorCode.ORDER_NOT_FOUND);
    if (stage === "deposit") {
      if (order.status !== OrderStatus.CONFIRMED) throw new BizException(ErrorCode.ORDER_STATUS_ERR, 400);
      order.status = OrderStatus.DEPOSIT_PAID;
      order.deposit_paid_at = new Date();
      if (wxTransactionId) order.wx_transaction_id = wxTransactionId;
      await this.orderRepo.save(order);
      await this.logRepo.save({ order_id: orderId, action: "deposit_paid", description: `客户已支付定金 ${(order.deposit_amount / 100).toFixed(2)} 元，进入制作` });
    } else {
      if (order.status !== OrderStatus.DELIVERED) throw new BizException(ErrorCode.ORDER_STATUS_ERR, 400);
      order.status = OrderStatus.FINAL_PAID;
      order.final_paid_at = new Date();
      if (wxTransactionId) order.wx_transaction_id = wxTransactionId;
      await this.orderRepo.save(order);
      await this.logRepo.save({ order_id: orderId, action: "final_paid", description: `客户已支付尾款 ${(order.final_amount / 100).toFixed(2)} 元，等待评价` });
    }
    return this.findOne(orderId);
  }

  /** Admin: 上传交付成果 */
  async deliver(orderId: number, dto: { note?: string; files?: string[]; tracking_no?: string }, adminName?: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new BizException(ErrorCode.ORDER_NOT_FOUND);
    if (![OrderStatus.DEPOSIT_PAID, OrderStatus.DELIVERED].includes(order.status)) {
      throw new BizException(ErrorCode.ORDER_STATUS_ERR, 400);
    }
    order.delivery_note = dto.note || "";
    order.delivery_files = dto.files || [];
    order.delivery_tracking_no = dto.tracking_no || "";
    order.delivered_at = new Date();
    order.status = OrderStatus.DELIVERED;
    // 定金 100% 的订单无需尾款，交付即视为付清
    if (order.final_amount <= 0) {
      order.status = OrderStatus.FINAL_PAID;
      order.final_paid_at = new Date();
    }
    await this.orderRepo.save(order);
    await this.logRepo.save({
      order_id: orderId, action: "deliver", operator: adminName || "团队",
      description: order.final_amount <= 0 ? "团队已交付成果，无需尾款，等待客户评价" : "团队已交付成果，等待客户确认并支付尾款",
    });
    return this.findOne(orderId);
  }

  /** Admin: 分配负责成员 */
  async assign(orderId: number, adminId: number, adminName: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new BizException(ErrorCode.ORDER_NOT_FOUND);
    order.assigned_admin_id = adminId;
    order.assigned_admin_name = adminName;
    await this.orderRepo.save(order);
    await this.logRepo.save({ order_id: orderId, action: "assign", description: `分配负责成员：${adminName}` });
    return this.findOne(orderId);
  }

  /** Admin: 催付标记 */
  async remindPayment(orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new BizException(ErrorCode.ORDER_NOT_FOUND);
    order.payment_reminded = 1;
    await this.orderRepo.save(order);
    await this.logRepo.save({ order_id: orderId, action: "remind", description: "团队已催付" });
    return this.findOne(orderId);
  }

  /** 用户: 评价（付清尾款后开放） */
  async review(orderId: number, userId: number, dto: { score: number; content?: string; anonymous?: boolean }) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, user_id: userId } });
    if (!order) throw new BizException(ErrorCode.ORDER_NOT_FOUND);
    if (order.status !== OrderStatus.FINAL_PAID) throw new BizException(ErrorCode.ORDER_STATUS_ERR, 400);
    const score = Math.min(5, Math.max(1, Math.round(+dto.score)));
    order.review_score = score;
    order.review_content = dto.content || "";
    order.review_anonymous = dto.anonymous ? 1 : 0;
    order.reviewed_at = new Date();
    order.status = OrderStatus.COMPLETED;
    order.completed_at = new Date();
    await this.orderRepo.save(order);
    await this.logRepo.save({ order_id: orderId, action: "review", description: `客户评价 ${score} 星，订单完成` });
    if (order.product_id) {
      await this.productRepo.increment({ id: order.product_id }, "sold_count", 1);
    }
    return this.findOne(orderId);
  }

  /** 用户: 取消订单（付定金前可取消） */
  async cancelByUser(orderId: number, userId: number, reason?: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, user_id: userId } });
    if (!order) throw new BizException(ErrorCode.ORDER_NOT_FOUND);
    if (![OrderStatus.PENDING_QUOTE, OrderStatus.QUOTING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new BizException(ErrorCode.ORDER_STATUS_ERR, 400);
    }
    return this.doCancel(order, reason || "客户取消");
  }

  /** Admin: 取消订单（付定金前；付定金后走退款） */
  async cancelByAdmin(orderId: number, reason?: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new BizException(ErrorCode.ORDER_NOT_FOUND);
    if (![OrderStatus.PENDING_QUOTE, OrderStatus.QUOTING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new BizException(ErrorCode.ORDER_STATUS_ERR, 400);
    }
    return this.doCancel(order, reason || "团队取消");
  }

  private async doCancel(order: Order, reason: string) {
    order.status = OrderStatus.CANCELLED;
    order.cancelled_at = new Date();
    order.cancel_reason = reason;
    await this.orderRepo.save(order);
    await this.logRepo.save({ order_id: order.id, action: "cancel", description: "订单已取消：" + reason });
    return this.findOne(order.id);
  }

  /** Admin: 直接改状态（退款流程等使用） */
  async updateStatus(orderId: number, status: OrderStatus) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new BizException(ErrorCode.ORDER_NOT_FOUND);
    await this.orderRepo.update(orderId, { status } as any);
    await this.logRepo.save({ order_id: orderId, action: "status_change", description: "状态变更为: " + status });
    return this.findOne(orderId);
  }

  async findUserOrder(orderId: number, userId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId }, relations: ["product", "category", "user", "logs", "quotes"] as any,
    });
    if (!order) throw new BizException(ErrorCode.ORDER_NOT_FOUND);
    if (order.user_id !== userId) throw new BizException(ErrorCode.ORDER_NOT_FOUND);
    return order;
  }

  /** 公开: 评价精选（首页/服务详情展示） */
  async findReviews(productId?: number, limit = 10) {
    const qb = this.orderRepo.createQueryBuilder("o")
      .leftJoinAndSelect("o.user", "u")
      .leftJoinAndSelect("o.product", "p")
      .where("o.review_score IS NOT NULL");
    if (productId) qb.andWhere("o.product_id = :pid", { pid: productId });
    qb.orderBy("o.reviewed_at", "DESC").take(Math.min(+limit || 10, 50));
    const list = await qb.getMany();
    return list.map((o) => ({
      id: o.id,
      score: o.review_score,
      content: o.review_content,
      title: o.title,
      nickname: o.review_anonymous ? this.maskName(o.user?.nickname) : (o.user?.nickname || "匿名客户"),
      avatar: o.review_anonymous ? "" : (o.user?.avatar || ""),
      reviewed_at: o.reviewed_at,
    }));
  }

  /** Admin: 仪表盘统计 */
  async dashboardStats() {
    const count = (st: OrderStatus) => this.orderRepo.count({ where: { status: st } });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthOrders = await this.orderRepo.find({
      where: { quote_confirmed_at: Between(monthStart, now) as any },
    });
    const monthDealAmount = monthOrders.reduce((s, o) => s + (o.quote_amount || 0), 0);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const newToday = await this.orderRepo.count({ where: { created_at: Between(todayStart, now) as any } });

    return {
      new_today: newToday,
      pending_quote: await count(OrderStatus.PENDING_QUOTE),
      quoting: await count(OrderStatus.QUOTING),
      awaiting_deposit: await count(OrderStatus.CONFIRMED),
      in_production: await count(OrderStatus.DEPOSIT_PAID),
      awaiting_final: await count(OrderStatus.DELIVERED),
      awaiting_review: await count(OrderStatus.FINAL_PAID),
      month_deal_count: monthOrders.length,
      month_deal_amount: monthDealAmount,
    };
  }

  private maskName(name?: string) {
    if (!name) return "匿名客户";
    return name.slice(0, 1) + "**";
  }

  private genNo(): string {
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return d + uuid().replace(/-/g, "").slice(0, 16).toUpperCase();
  }
}
