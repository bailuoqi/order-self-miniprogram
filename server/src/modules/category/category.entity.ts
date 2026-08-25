import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  /** 业务大类：software=软件定制, electronics=电子代做 */
  @Column({ default: 'software' }) group: string;
  @Column({ nullable: true }) icon: string;
  @Column({ default: 0 }) sort: number;
  @Column({ default: 1 }) status: number;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}