import { Module } from '@nestjs/common';

import { AuditModule } from 'src/admin/audit/audit.module';

import { EquationsController } from './equations.controller';
import { EquationsService } from './equations.service';

@Module({
  controllers: [EquationsController],
  providers: [EquationsService],
  imports: [AuditModule],
  exports: [EquationsService],
})
export class EquationsModule {}
