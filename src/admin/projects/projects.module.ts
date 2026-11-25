import { Module } from '@nestjs/common';

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

import { FarmsModule } from '../../farm/farms/farms.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [FarmsModule, UsersModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
