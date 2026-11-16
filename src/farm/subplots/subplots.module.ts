import { Module } from '@nestjs/common';
import { PlotsModule } from '../plots/plots.module';

import { SubPlotsController } from './subplots.controller';
import { SubPlotsService } from './subplots.service';

@Module({
  providers: [SubPlotsService],
  controllers: [SubPlotsController],
  imports: [PlotsModule],
  exports: [SubPlotsService],
})
export class SubplotsModule {}
