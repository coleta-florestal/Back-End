import { Module } from '@nestjs/common';
import { SubPlotsService } from './subplots.service';
import { SubPlotsController } from './subplots.controller';

@Module({
  providers: [SubPlotsService],
  controllers: [SubPlotsController],
})
export class SubplotsModule {}
