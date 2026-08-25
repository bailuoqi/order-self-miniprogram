import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

/** 报价记录（可多轮商议，金额单位：分） */
@Entity('order_quotes')
export class OrderQuote {
  @PrimaryGeneratedColumn() id: number;
  @Column() order_id: number;
  @ManyToOne(() => Order) @JoinColumn({ name: 'order_id' }) order: Order;
  @Column() amount: number;
  @Column() deposit_amount: number;
  @Column() final_amount: number;
  @Column({ nullable: true }) days: string;
  @Column({ type: 'text', nullable: true }) note: string;
  @Column({ nullable: true }) created_by: string;
  @Column({ default: 0 }) is_confirmed: number;
  @CreateDateColumn() created_at: Date;
}
