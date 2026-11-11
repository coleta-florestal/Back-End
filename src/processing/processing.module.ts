import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EquationsModule } from 'src/admin/equations/equations.module';
import { ProcessingController } from './processing.controller';
import { ProcessingService } from './processing.service';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [PrismaModule, EquationsModule],
  controllers: [ProcessingController],
  providers: [ProcessingService, StatisticsService],
  exports: [ProcessingService, StatisticsService],
})
export class ProcessingModule {}
