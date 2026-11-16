import { Module } from '@nestjs/common';
import { PlotsModule } from '../plots/plots.module';
import { AuditModule } from '../../admin/audit/audit.module';

import { SubPlotsController } from './subplots.controller';
import { SubPlotsService } from './subplots.service';

@Module({
  providers: [SubPlotsService],
  controllers: [SubPlotsController],
  imports: [PlotsModule, AuditModule],
  exports: [SubPlotsService],
})
export class SubplotsModule {}
