import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JoinApplication } from './join-application.entity';
import { RecruitService } from './recruit.service';
import { RecruitController } from './recruit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([JoinApplication])],
  controllers: [RecruitController],
  providers: [RecruitService],
  exports: [RecruitService],
})
export class RecruitModule {}
