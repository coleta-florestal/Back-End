import { Module } from '@nestjs/common';

import { ValidationsService } from './validations.service';
import { ValidationsController } from './validations.controller';

import { AuditModule } from 'src/admin/audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [ValidationsService],
  controllers: [ValidationsController],
  exports: [ValidationsService],
})
export class ValidationsModule {}
