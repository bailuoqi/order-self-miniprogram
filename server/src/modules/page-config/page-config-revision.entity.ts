import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

/**
 * 页面配置发布历史（每次 publish / rollback 写入一条）。
 * 每个 page_key 仅保留最近 20 条，超出由服务层自动裁剪。
 */
@Entity("page_config_revisions")
export class PageConfigRevision {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  page_key: string; // 发布目标 key（如 "home"，不含 -draft 后缀）

  @Column({ type: "text" })
  config_json: string; // 发布时刻的完整配置快照

  @Column()
  action: string; // 'publish' | 'rollback'

  @Column({ default: "" })
  operator: string; // 操作人（管理员用户名）

  @CreateDateColumn()
  created_at: Date;
}
