import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EquationsService } from 'src/admin/equations/equations.service';
import { ProcessingController } from './processing.controller';
import { ProcessingService } from './processing.service';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProcessingController],
  providers: [ProcessingService, StatisticsService, EquationsService],
  exports: [ProcessingService, StatisticsService],
})
export class ProcessingModule {}
