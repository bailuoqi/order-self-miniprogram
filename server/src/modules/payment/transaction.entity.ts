import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Order } from '../order/order.entity';

export enum TransactionType { PAY = 'pay', REFUND = 'refund' }
/** 支付阶段：定金 / 尾款 */
export enum PaymentStage { DEPOSIT = 'deposit', FINAL = 'final' }
export enum TransactionStatus { PENDING = 'pending', SUCCESS = 'success', FAILED = 'failed' }

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) transaction_no: string;
  @Column() user_id: number;
  @ManyToOne(() => User) @JoinColumn({ name: 'user_id' }) user: User;
  @Column({ nullable: true }) order_id: number;
  @ManyToOne(() => Order, { nullable: true }) @JoinColumn({ name: 'order_id' }) order: Order;
  @Column({ type: 'varchar' }) type: TransactionType;
  @Column({ type: 'varchar', nullable: true }) stage: PaymentStage;
  @Column() amount: number;
  @Column({ type: 'varchar', default: TransactionStatus.PENDING }) status: TransactionStatus;
  @Column({ nullable: true }) third_party_no: string;
  @Column({ default: 'wechat' }) pay_method: string;
  @Column({ type: 'simple-json', nullable: true }) raw_data: any;
  @CreateDateColumn() created_at: Date;
}
