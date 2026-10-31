import { Module } from '@nestjs/common';
import { FarmsModule } from './farms/farms.module';
import { PlotsModule } from './plots/plots.module';
import { SubplotsModule } from './subplots/subplots.module';
import { TreesModule } from './trees/trees.module';

@Module({
  imports: [FarmModule, FarmsModule, PlotsModule, SubplotsModule, TreesModule],
})
export class FarmModule {}
