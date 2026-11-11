import { Module } from '@nestjs/common';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

import { ProcessingModule } from 'src/processing/processing.module';

@Module({
  imports: [ProcessingModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
