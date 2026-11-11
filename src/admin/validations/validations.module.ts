import { Module } from '@nestjs/common';
import { ValidationsService } from './validations.service';
import { ValidationsController } from './validations.controller';

@Module({
  providers: [ValidationsService],
  controllers: [ValidationsController],
  exports: [ValidationsService],
})
export class ValidationsModule {}
