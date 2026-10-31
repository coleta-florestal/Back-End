import { Module } from '@nestjs/common';
import { SubplotsService } from './subplots.service';
import { SubplotsController } from './subplots.controller';

@Module({
  providers: [SubplotsService],
  controllers: [SubplotsController],
})
export class SubplotsModule {}
