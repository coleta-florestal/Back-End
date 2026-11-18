import { Module } from '@nestjs/common';
import { FarmsModule } from '../farms/farms.module';
import { AuditModule } from '../../admin/audit/audit.module';

import { PlotsService } from './plots.service';
import { PlotsController } from './plots.controller';

@Module({
  providers: [PlotsService],
  controllers: [PlotsController],
  imports: [FarmsModule, AuditModule],
  exports: [PlotsService],
})
export class PlotsModule {}
