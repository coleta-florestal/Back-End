import { Module } from '@nestjs/common';

import { FarmsService } from './farms.service';

import { FarmsController } from './farms.controller';

import { AuditModule } from '../../admin/audit/audit.module';

@Module({
  providers: [FarmsService],
  controllers: [FarmsController],
  exports: [FarmsService],
  imports: [AuditModule],
})
export class FarmsModule {}
