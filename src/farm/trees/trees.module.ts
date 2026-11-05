import { Module } from '@nestjs/common';
import { FarmsModule } from '../farms/farms.module';
import { PlotsModule } from '../plots/plots.module';
import { SubplotsModule } from '../subplots/subplots.module';

import { TreesService } from './trees.service';
import { PlotsService } from '../plots/plots.service';
import { SubPlotsService } from '../subplots/subplots.service';
import { FarmsService } from '../farms/farms.service';

import { TreesController } from './trees.controller';

@Module({
  controllers: [TreesController],
  providers: [TreesService, PlotsService, SubPlotsService, FarmsService],
  imports: [PlotsModule, SubplotsModule, FarmsModule],
})
export class TreesModule {}
