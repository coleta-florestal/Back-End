import { Module } from '@nestjs/common';
import { PlotsService } from './plots.service';
import { PlotsController } from './plots.controller';
import { FarmsService } from '../farms/farms.service';
import { FarmsModule } from '../farms/farms.module';

@Module({
  providers: [PlotsService, FarmsService],
  controllers: [PlotsController],
  imports: [FarmsModule],
  exports: [PlotsService],
})
export class PlotsModule {}
