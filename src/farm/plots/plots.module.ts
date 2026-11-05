import { Module } from '@nestjs/common';
import { FarmsModule } from '../farms/farms.module';

import { PlotsService } from './plots.service';
import { FarmsService } from '../farms/farms.service';

import { PlotsController } from './plots.controller';

@Module({
  providers: [PlotsService, FarmsService],
  controllers: [PlotsController],
  imports: [FarmsModule],
  exports: [PlotsService],
})
export class PlotsModule {}
