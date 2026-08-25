import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from '../order/order.entity';

/** 会话挂在订单上：客户 ↔ 团队（后台），用于报价商议 */
@Entity('im_sessions')
export class ImSession {
  @PrimaryGeneratedColumn() id: number;
  @Column() user_id: number;
  @Column() order_id: number;
  @ManyToOne(() => Order) @JoinColumn({ name: 'order_id' }) order: Order;
  @Column({ nullable: true }) last_message: string;
  @Column({ nullable: true }) last_message_at: Date;
  @Column({ default: 0 }) user_unread: number;
  @Column({ default: 0 }) team_unread: number;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
