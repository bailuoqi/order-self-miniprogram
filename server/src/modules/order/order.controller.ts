import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AdminAuthGuard } from "../../common/guards/admin-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { OrderService } from "./order.service";

@Controller("orders")
export class OrderController {
  constructor(private service: OrderService) {}

  // Admin: 全部订单
  @Get()
  @UseGuards(AdminAuthGuard)
  adminFindAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  // Admin: 仪表盘统计
  @Get("stats/dashboard")
  @UseGuards(AdminAuthGuard)
  dashboardStats() {
    return this.service.dashboardStats();
  }

  // 公开: 评价精选
  @Get("reviews")
  reviews(@Query() query: any) {
    return this.service.findReviews(query.product_id ? +query.product_id : undefined, query.limit ? +query.limit : 10);
  }

  // 用户: 从标准服务下单（进入待报价）
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.service.createFromProduct(user.id, body);
  }

  // 用户: 发布自定义需求
  @Post("custom")
  @UseGuards(JwtAuthGuard)
  createCustom(@CurrentUser() user: any, @Body() body: any) {
    return this.service.createCustom(user.id, body);
  }

  // 用户: 我的订单
  @Get("my")
  @UseGuards(JwtAuthGuard)
  myOrders(@CurrentUser() user: any, @Query() query: any) {
    return this.service.findByUser(user.id, query.status, query.page, query.pageSize);
  }

  // 管理员: 订单详情
  @Get("admin/:id")
  @UseGuards(AdminAuthGuard)
  adminDetail(@Param("id") id: string) {
    return this.service.findOne(+id);
  }

  // 用户: 订单详情（验证所有权）
  @Get(":id")
  @UseGuards(JwtAuthGuard)
  detail(@Param("id") id: string, @CurrentUser() user: any) {
    return this.service.findUserOrder(+id, user.id);
  }

  // Admin: 填写/修改报价
  @Post(":id/quote")
  @UseGuards(AdminAuthGuard)
  quote(@Param("id") id: string, @CurrentUser() admin: any, @Body() body: any) {
    return this.service.quote(+id, body, admin.username);
  }

  // 用户: 确认报价
  @Post(":id/confirm-quote")
  @UseGuards(JwtAuthGuard)
  confirmQuote(@Param("id") id: string, @CurrentUser() user: any) {
    return this.service.confirmQuote(+id, user.id);
  }

  // Admin: 上传交付成果
  @Post(":id/deliver")
  @UseGuards(AdminAuthGuard)
  deliver(@Param("id") id: string, @CurrentUser() admin: any, @Body() body: any) {
    return this.service.deliver(+id, body, admin.username);
  }

  // Admin: 分配负责成员
  @Post(":id/assign")
  @UseGuards(AdminAuthGuard)
  assign(@Param("id") id: string, @Body() body: { admin_id: number; admin_name: string }) {
    return this.service.assign(+id, body.admin_id, body.admin_name);
  }

  // Admin: 催付标记
  @Post(":id/remind")
  @UseGuards(AdminAuthGuard)
  remind(@Param("id") id: string) {
    return this.service.remindPayment(+id);
  }

  // 用户: 评价
  @Post(":id/review")
  @UseGuards(JwtAuthGuard)
  review(@Param("id") id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.service.review(+id, user.id, body);
  }

  // 用户: 取消订单
  @Post(":id/cancel")
  @UseGuards(JwtAuthGuard)
  cancel(@Param("id") id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.service.cancelByUser(+id, user.id, body?.reason);
  }

  // Admin: 取消订单
  @Post("admin/:id/cancel")
  @UseGuards(AdminAuthGuard)
  adminCancel(@Param("id") id: string, @Body() body: any) {
    return this.service.cancelByAdmin(+id, body?.reason);
  }

  // Admin: 直接改状态
  @Put(":id/status")
  @UseGuards(AdminAuthGuard)
  updateStatus(@Param("id") id: string, @Body() body: { status: string }) {
    return this.service.updateStatus(+id, body.status as any);
  }
}
