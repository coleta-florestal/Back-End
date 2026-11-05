import { Module } from '@nestjs/common';
import { PlotsModule } from '../plots/plots.module';
import { FarmsModule } from '../farms/farms.module';

import { SubPlotsController } from './subplots.controller';

import { SubPlotsService } from './subplots.service';
import { PlotsService } from '../plots/plots.service';
import { FarmsService } from '../farms/farms.service';

@Module({
  providers: [SubPlotsService, PlotsService, FarmsService],
  controllers: [SubPlotsController],
  imports: [PlotsModule, FarmsModule],
})
export class SubplotsModule {}
