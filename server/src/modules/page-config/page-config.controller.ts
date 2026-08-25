import { Controller, Get, Post, Put, Param, Body, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../../common/guards/admin-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PageConfigService } from "./page-config.service";

@Controller("page-config")
export class PageConfigController {
  constructor(private service: PageConfigService) {}

  // ===== 二期新增：发布通道（均为两段路径，与既有单段 :pageKey 不冲突）=====

  @Post(":pageKey/publish")
  @UseGuards(AdminAuthGuard)
  publish(@Param("pageKey") pageKey: string, @Body() body: any, @CurrentUser() user: any) {
    return this.service.publish(pageKey, body?.config, this.operatorOf(user));
  }

  @Get(":pageKey/revisions")
  @UseGuards(AdminAuthGuard)
  getRevisions(@Param("pageKey") pageKey: string) {
    return this.service.getRevisions(pageKey);
  }

  @Get(":pageKey/revisions/:id")
  @UseGuards(AdminAuthGuard)
  getRevision(@Param("pageKey") pageKey: string, @Param("id") id: string) {
    return this.service.getRevision(pageKey, Number(id));
  }

  @Post(":pageKey/rollback")
  @UseGuards(AdminAuthGuard)
  rollback(@Param("pageKey") pageKey: string, @Body() body: any, @CurrentUser() user: any) {
    return this.service.rollback(pageKey, Number(body?.revisionId), this.operatorOf(user));
  }

  @Get(":pageKey/meta")
  @UseGuards(AdminAuthGuard)
  getMeta(@Param("pageKey") pageKey: string) {
    return this.service.getMeta(pageKey);
  }

  // ===== 既有契约（GET/PUT/getAllKeys），行为不变 =====

  @Get(":pageKey")
  getConfig(@Param("pageKey") pageKey: string) {
    return this.service.getConfig(pageKey);
  }

  @Put(":pageKey")
  @UseGuards(AdminAuthGuard)
  updateConfig(@Param("pageKey") pageKey: string, @Body() body: any) {
    return this.service.updateConfig(pageKey, body.config || body);
  }

  @Get()
  @UseGuards(AdminAuthGuard)
  getAllKeys() {
    return this.service.getAllKeys();
  }

  private operatorOf(user: any): string {
    return user?.username || (user?.id ? `admin#${user.id}` : "admin");
  }
}
