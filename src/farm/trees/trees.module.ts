import { Module } from '@nestjs/common';
import { TreesController } from './trees.controller';
import { TreesService } from './trees.service';
import { PlotsModule } from '../plots/plots.module';
import { SubplotsModule } from '../subplots/subplots.module';
import { FarmsModule } from '../farms/farms.module';
import { PlotsService } from '../plots/plots.service';
import { SubPlotsService } from '../subplots/subplots.service';
import { FarmsService } from '../farms/farms.service';

@Module({
  controllers: [TreesController],
  providers: [TreesService, PlotsService, SubPlotsService, FarmsService],
  imports: [PlotsModule, SubplotsModule, FarmsModule],
})
export class TreesModule {}
