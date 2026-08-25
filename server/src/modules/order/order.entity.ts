import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../user/user.entity';
import { Product } from '../product/product.entity';
import { Category } from '../category/category.entity';
import { OrderLog } from './order-log.entity';
import { OrderQuote } from './order-quote.entity';

/**
 * 订单状态机（唯一流程，顺序不能乱）：
 * pending_quote → quoting → confirmed → deposit_paid → delivered → final_paid → completed
 * 旁路：cancelled / refunding / refunded
 */
export enum OrderStatus {
  PENDING_QUOTE = 'pending_quote', // 已下单，待报价
  QUOTING = 'quoting',             // 报价商议中
  CONFIRMED = 'confirmed',         // 已敲定，待付定金
  DEPOSIT_PAID = 'deposit_paid',   // 已付定金，制作中
  DELIVERED = 'delivered',         // 已交付成果，待付尾款
  FINAL_PAID = 'final_paid',       // 已付尾款，待评价
  COMPLETED = 'completed',         // 已评价/已完成
  CANCELLED = 'cancelled',
  REFUNDING = 'refunding',
  REFUNDED = 'refunded',
}

export enum OrderSource {
  PRODUCT = 'product', // 标准服务下单
  CUSTOM = 'custom',   // 自定义需求
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) order_no: string;
  @Column() user_id: number;
  @ManyToOne(() => User) @JoinColumn({ name: 'user_id' }) user: User;

  // 来源：标准服务 或 自定义需求
  @Column({ type: 'varchar', default: OrderSource.CUSTOM }) source: OrderSource;
  @Column({ nullable: true }) product_id: number;
  @ManyToOne(() => Product, { nullable: true }) @JoinColumn({ name: 'product_id' }) product: Product;
  @Column({ nullable: true }) category_id: number;
  @ManyToOne(() => Category, { nullable: true }) @JoinColumn({ name: 'category_id' }) category: Category;

  // 需求信息
  @Column() title: string;
  @Column({ type: 'text', nullable: true }) requirement: string;
  @Column({ nullable: true }) contact: string;
  @Column({ nullable: true }) expected_days: string;
  @Column({ type: 'simple-json', nullable: true }) attachments: string[];

  // 报价（当前生效报价，历史记录见 quotes；金额单位：分）
  @Column({ default: 0 }) quote_amount: number;
  @Column({ default: 0 }) deposit_amount: number;
  @Column({ default: 0 }) final_amount: number;
  @Column({ nullable: true }) quote_days: string;
  @Column({ type: 'text', nullable: true }) quote_note: string;
  @Column({ nullable: true }) quoted_at: Date;
  @Column({ nullable: true }) quote_confirmed_at: Date;

  // 后台分配的负责成员
  @Column({ nullable: true }) assigned_admin_id: number;
  @Column({ nullable: true }) assigned_admin_name: string;

  // 支付
  @Column({ nullable: true }) deposit_paid_at: Date;
  @Column({ nullable: true }) final_paid_at: Date;
  @Column({ nullable: true }) wx_transaction_id: string;

  // 交付
  @Column({ type: 'text', nullable: true }) delivery_note: string;
  @Column({ type: 'simple-json', nullable: true }) delivery_files: string[];
  @Column({ nullable: true }) delivery_tracking_no: string;
  @Column({ nullable: true }) delivered_at: Date;

  // 评价
  @Column({ nullable: true }) review_score: number;
  @Column({ type: 'text', nullable: true }) review_content: string;
  @Column({ default: 0 }) review_anonymous: number;
  @Column({ nullable: true }) reviewed_at: Date;

  // 催付标记（后台标记即可）
  @Column({ default: 0 }) payment_reminded: number;

  @Column({ type: 'varchar', default: OrderStatus.PENDING_QUOTE }) status: OrderStatus;
  @Column({ nullable: true }) completed_at: Date;
  @Column({ nullable: true }) cancelled_at: Date;
  @Column({ type: 'text', nullable: true }) cancel_reason: string;

  @OneToMany(() => OrderLog, (log: OrderLog) => log.order) logs: OrderLog[];
  @OneToMany(() => OrderQuote, (q: OrderQuote) => q.order) quotes: OrderQuote[];
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
