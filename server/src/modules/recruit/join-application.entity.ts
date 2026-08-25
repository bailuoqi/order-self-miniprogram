import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum JoinApplicationStatus { PENDING = 'pending', APPROVED = 'approved', REJECTED = 'rejected' }

/** 「加入我们」纳新申请：小程序提交，后台审核；通过后由管理员在后台创建团队成员账号 */
@Entity('join_applications')
export class JoinApplication {
  @PrimaryGeneratedColumn() id: number;
  @Column({ nullable: true }) user_id: number;
  @Column() name: string;
  @Column() contact: string;
  /** 方向：software=软件, electronics=电子, both=两者 */
  @Column({ default: 'software' }) direction: string;
  @Column({ type: 'text', nullable: true }) intro: string;
  @Column({ type: 'text', nullable: true }) works: string;
  @Column({ type: 'simple-json', nullable: true }) attachments: string[];
  @Column({ type: 'varchar', default: JoinApplicationStatus.PENDING }) status: JoinApplicationStatus;
  @Column({ nullable: true }) admin_remark: string;
  @Column({ nullable: true }) audited_at: Date;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
