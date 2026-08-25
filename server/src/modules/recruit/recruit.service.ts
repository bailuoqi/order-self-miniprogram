import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JoinApplication, JoinApplicationStatus } from './join-application.entity';

@Injectable()
export class RecruitService {
  constructor(
    @InjectRepository(JoinApplication) private repo: Repository<JoinApplication>,
  ) {}

  /** 用户: 提交纳新申请 */
  async apply(userId: number, dto: { name: string; contact: string; direction?: string; intro?: string; works?: string; attachments?: string[] }) {
    if (!dto.name || !dto.contact) throw new BadRequestException('姓名与联系方式必填');
    const pending = await this.repo.findOne({ where: { user_id: userId, status: JoinApplicationStatus.PENDING } });
    if (pending) throw new BadRequestException('已有申请正在审核中，请耐心等待');

    return this.repo.save(this.repo.create({
      user_id: userId,
      name: dto.name,
      contact: dto.contact,
      direction: dto.direction || 'software',
      intro: dto.intro || '',
      works: dto.works || '',
      attachments: dto.attachments || [],
    }));
  }

  /** 用户: 我的申请状态 */
  async findByUser(userId: number) {
    return this.repo.find({ where: { user_id: userId }, order: { created_at: 'DESC' } });
  }

  /** Admin: 申请列表 */
  async findAll(query?: { status?: string; page?: number; pageSize?: number }) {
    const { status, page = 1, pageSize = 20 } = query || {};
    const where: any = {};
    if (status) where.status = status;
    const [list, total] = await this.repo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: (+page - 1) * +pageSize,
      take: +pageSize,
    });
    return { list, total, page: +page, pageSize: +pageSize };
  }

  /** Admin: 通过/拒绝 */
  async audit(id: number, approved: boolean, remark?: string) {
    const app = await this.repo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('申请不存在');
    if (app.status !== JoinApplicationStatus.PENDING) throw new BadRequestException('该申请已处理');
    app.status = approved ? JoinApplicationStatus.APPROVED : JoinApplicationStatus.REJECTED;
    app.admin_remark = remark || '';
    app.audited_at = new Date();
    return this.repo.save(app);
  }
}
