import { Module } from '@nestjs/common';
import { PlotsService } from './plots.service';
import { PlotsController } from './plots.controller';

@Module({
  providers: [PlotsService],
  controllers: [PlotsController],
})
export class PlotsModule {}
