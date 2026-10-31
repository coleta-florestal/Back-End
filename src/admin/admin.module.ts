import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { EquationsModule } from './equations/equations.module';
import { ValidationsModule } from './validations/validations.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [UsersModule, ProjectsModule, EquationsModule, ValidationsModule, AuditModule],
})
export class AdminModule {}
