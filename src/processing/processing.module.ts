import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EquationsModule } from 'src/admin/equations/equations.module';
import { AuditModule } from 'src/admin/audit/audit.module';
import { ProcessingController } from './processing.controller';
import { ProcessingService } from './processing.service';
import { StatisticsService } from './statistics.service';
import { HypsometricService } from './hypsometric.service';

@Module({
  imports: [PrismaModule, EquationsModule, AuditModule],
  controllers: [ProcessingController],
  providers: [ProcessingService, StatisticsService, HypsometricService],
  exports: [ProcessingService, StatisticsService, HypsometricService],
})
export class ProcessingModule {}
