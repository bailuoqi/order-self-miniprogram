import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/** 团队成员角色：super=超级管理员, admin=管理员, sales=商务报价, maker=制作, finance=财务, editor=内容编辑 */
export enum AdminRole { SUPER = 'super', ADMIN = 'admin', SALES = 'sales', MAKER = 'maker', FINANCE = 'finance', EDITOR = 'editor' }

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) username: string;
  @Column() password: string;
  @Column() display_name: string;
  @Column({ type: 'varchar', default: AdminRole.ADMIN }) role: AdminRole;
  @Column({ nullable: true }) avatar: string;
  @Column({ default: 1 }) status: number;
  @Column({ nullable: true }) last_login_at: Date;
  @Column({ nullable: true }) last_login_ip: string;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}