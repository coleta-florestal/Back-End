import { Module } from '@nestjs/common';
import { EquationsController } from './equations.controller';
import { EquationsService } from './equations.service';

@Module({
  controllers: [EquationsController],
  providers: [EquationsService],
  exports: [EquationsService],
})
export class EquationsModule {}
