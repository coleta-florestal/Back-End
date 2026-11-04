import { Module } from '@nestjs/common';
import { SubPlotsService } from './subplots.service';
import { SubPlotsController } from './subplots.controller';
import { PlotsService } from '../plots/plots.service';
import { PlotsModule } from '../plots/plots.module';
import { FarmsService } from '../farms/farms.service';
import { FarmsModule } from '../farms/farms.module';

@Module({
  providers: [SubPlotsService, PlotsService, FarmsService],
  controllers: [SubPlotsController],
  imports: [PlotsModule, FarmsModule],
})
export class SubplotsModule {}
