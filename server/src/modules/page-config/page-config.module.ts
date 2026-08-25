import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PageConfig } from "./page-config.entity";
import { PageConfigRevision } from "./page-config-revision.entity";
import { PageConfigService } from "./page-config.service";
import { PageConfigController } from "./page-config.controller";

@Module({
  imports: [TypeOrmModule.forFeature([PageConfig, PageConfigRevision])],
  controllers: [PageConfigController],
  providers: [PageConfigService],
  exports: [PageConfigService],
})
export class PageConfigModule {}
