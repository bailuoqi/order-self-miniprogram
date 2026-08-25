import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImSession } from './im-session.entity';
import { ImMessage, MessageType } from './im-message.entity';
import { Order } from '../order/order.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ImSession) private sessionRepo: Repository<ImSession>,
    @InjectRepository(ImMessage) private msgRepo: Repository<ImMessage>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  /** 用户：获取/创建订单会话（校验订单归属） */
  async getOrCreateOrderSession(userId: number, orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order || order.user_id !== userId) throw new NotFoundException('订单不存在');

    let session = await this.sessionRepo.findOne({ where: { order_id: orderId } });
    if (!session) {
      session = await this.sessionRepo.save(
        this.sessionRepo.create({ user_id: userId, order_id: orderId }),
      );
    }
    return this.sessionRepo.findOne({ where: { id: session.id }, relations: ['order'] });
  }

  /** 用户：我的会话列表 */
  async getUserSessions(userId: number) {
    return this.sessionRepo.find({
      where: { user_id: userId },
      relations: ['order'],
      order: { last_message_at: 'DESC' },
    });
  }

  /** 后台：全部会话列表 */
  async getAdminSessions() {
    return this.sessionRepo.find({
      relations: ['order', 'order.user'],
      order: { last_message_at: 'DESC' },
    });
  }

  /** 后台：按订单获取/创建会话 */
  async getOrCreateSessionByOrder(orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    let session = await this.sessionRepo.findOne({ where: { order_id: orderId } });
    if (!session) {
      session = await this.sessionRepo.save(
        this.sessionRepo.create({ user_id: order.user_id, order_id: orderId }),
      );
    }
    return this.sessionRepo.findOne({ where: { id: session.id }, relations: ['order', 'order.user'] });
  }

  async getMessages(sessionId: number, page = 1, pageSize = 30) {
    const [list, total] = await this.msgRepo.findAndCount({
      where: { session_id: sessionId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list: list.reverse(), total, page, pageSize };
  }

  /** 校验用户是会话参与者 */
  async assertUserSession(sessionId: number, userId: number) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session || session.user_id !== userId) throw new ForbiddenException('无权访问该会话');
    return session;
  }

  /** 发消息：fromTeam=true 表示团队（后台）发送 */
  async sendMessage(sessionId: number, fromTeam: boolean, senderName: string, content: string, type: MessageType = MessageType.TEXT, attachment?: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('会话不存在');

    const msg = this.msgRepo.create({
      session_id: sessionId,
      from_team: fromTeam ? 1 : 0,
      sender_name: senderName,
      content,
      type,
      attachment: attachment || null as any,
    });
    await this.msgRepo.save(msg);

    const patch: any = { last_message: content.slice(0, 100), last_message_at: new Date() };
    if (fromTeam) patch.user_unread = () => 'user_unread + 1';
    else patch.team_unread = () => 'team_unread + 1';
    await this.sessionRepo.createQueryBuilder().update().set(patch).where('id = :id', { id: sessionId }).execute();
    return msg;
  }

  /** 标记已读：user 端清 user_unread，team 端清 team_unread */
  async markRead(sessionId: number, isTeam: boolean) {
    if (isTeam) {
      await this.sessionRepo.update(sessionId, { team_unread: 0 });
      await this.msgRepo.update({ session_id: sessionId, from_team: 0, is_read: 0 }, { is_read: 1 });
    } else {
      await this.sessionRepo.update(sessionId, { user_unread: 0 });
      await this.msgRepo.update({ session_id: sessionId, from_team: 1, is_read: 0 }, { is_read: 1 });
    }
  }
}
