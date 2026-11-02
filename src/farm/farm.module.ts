import { Module } from '@nestjs/common';
import { FarmsModule } from './farms/farms.module';
import { PlotsModule } from './plots/plots.module';
import { SubplotsModule } from './subplots/subplots.module';
import { TreesModule } from './trees/trees.module';
import { InventoryStatusModule } from './status/inventory-status.module';

@Module({
  imports: [FarmsModule, PlotsModule, SubplotsModule, TreesModule, InventoryStatusModule],
  exports: [InventoryStatusModule],
})
export class FarmModule {}
