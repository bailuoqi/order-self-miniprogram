import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { MessageType } from './im-message.entity';

@Controller('chat')
export class ChatController {
  constructor(private service: ChatService) {}

  // ============ 后台（团队）端 ============

  @Get('admin/sessions')
  @UseGuards(AdminAuthGuard)
  adminSessions() {
    return this.service.getAdminSessions();
  }

  @Post('admin/order-session')
  @UseGuards(AdminAuthGuard)
  adminOrderSession(@Body() body: { order_id: number }) {
    return this.service.getOrCreateSessionByOrder(body.order_id);
  }

  @Get('admin/messages/:sessionId')
  @UseGuards(AdminAuthGuard)
  adminMessages(@Param('sessionId') id: string, @Query('page') page?: string) {
    return this.service.getMessages(+id, page ? +page : 1);
  }

  @Post('admin/messages/:sessionId')
  @UseGuards(AdminAuthGuard)
  adminSend(@CurrentUser() admin: any, @Param('sessionId') id: string, @Body() body: { content: string; type?: string; attachment?: string }) {
    return this.service.sendMessage(+id, true, admin.username || '团队', body.content, (body.type as MessageType) || MessageType.TEXT, body.attachment);
  }

  @Post('admin/read/:sessionId')
  @UseGuards(AdminAuthGuard)
  adminRead(@Param('sessionId') id: string) {
    return this.service.markRead(+id, true);
  }

  // ============ 小程序（客户）端 ============

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  getSessions(@CurrentUser() user: any) {
    return this.service.getUserSessions(user.id);
  }

  /** 按订单获取/创建会话（用于报价商议） */
  @Post('order-session')
  @UseGuards(JwtAuthGuard)
  orderSession(@CurrentUser() user: any, @Body() body: { order_id: number }) {
    return this.service.getOrCreateOrderSession(user.id, body.order_id);
  }

  @Get('messages/:sessionId')
  @UseGuards(JwtAuthGuard)
  async getMessages(@CurrentUser() user: any, @Param('sessionId') id: string, @Query('page') page?: string) {
    await this.service.assertUserSession(+id, user.id);
    return this.service.getMessages(+id, page ? +page : 1);
  }

  @Post('messages/:sessionId')
  @UseGuards(JwtAuthGuard)
  async sendMessage(@CurrentUser() user: any, @Param('sessionId') id: string, @Body() body: { content: string; type?: string; attachment?: string }) {
    await this.service.assertUserSession(+id, user.id);
    return this.service.sendMessage(+id, false, '客户', body.content, (body.type as MessageType) || MessageType.TEXT, body.attachment);
  }

  @Post('read/:sessionId')
  @UseGuards(JwtAuthGuard)
  async markRead(@CurrentUser() user: any, @Param('sessionId') id: string) {
    await this.service.assertUserSession(+id, user.id);
    return this.service.markRead(+id, false);
  }
}
