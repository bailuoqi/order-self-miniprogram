import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RecruitService } from './recruit.service';

@Controller('recruit')
export class RecruitController {
  constructor(private service: RecruitService) {}

  // 用户: 提交「加入我们」申请
  @Post('apply')
  @UseGuards(JwtAuthGuard)
  apply(@CurrentUser() user: any, @Body() body: any) {
    return this.service.apply(user.id, body);
  }

  // 用户: 我的申请
  @Get('my')
  @UseGuards(JwtAuthGuard)
  my(@CurrentUser() user: any) {
    return this.service.findByUser(user.id);
  }

  // Admin: 申请列表
  @Get()
  @UseGuards(AdminAuthGuard)
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  // Admin: 通过/拒绝
  @Put(':id/audit')
  @UseGuards(AdminAuthGuard)
  audit(@Param('id') id: string, @Body() body: { approved: boolean; remark?: string }) {
    return this.service.audit(+id, body.approved, body.remark);
  }
}
