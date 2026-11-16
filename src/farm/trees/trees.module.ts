import { Module } from '@nestjs/common';
import { SubplotsModule } from '../subplots/subplots.module';

import { TreesService } from './trees.service';
import { TreesController } from './trees.controller';

@Module({
  controllers: [TreesController],
  providers: [TreesService],
  imports: [SubplotsModule],
})
export class TreesModule {}
