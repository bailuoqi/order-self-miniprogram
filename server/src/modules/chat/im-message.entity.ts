import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum MessageType { TEXT = 'text', IMAGE = 'image', FILE = 'file', SYSTEM = 'system' }

@Entity('im_messages')
export class ImMessage {
  @PrimaryGeneratedColumn() id: number;
  @Column() session_id: number;
  /** 1 = 团队（后台成员）发送，0 = 客户发送 */
  @Column({ default: 0 }) from_team: number;
  @Column({ nullable: true }) sender_name: string;
  @Column({ type: 'varchar', default: MessageType.TEXT }) type: MessageType;
  @Column({ type: 'text' }) content: string;
  @Column({ nullable: true }) attachment: string;
  @Column({ default: 0 }) is_read: number;
  @CreateDateColumn() created_at: Date;
}
