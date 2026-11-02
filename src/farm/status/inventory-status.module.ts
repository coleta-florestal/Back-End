import { Module } from '@nestjs/common';
import { InventoryStatusService } from './inventory-status.service';

@Module({
  providers: [InventoryStatusService],
  exports: [InventoryStatusService],
})
export class InventoryStatusModule {}
