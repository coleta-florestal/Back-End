import { Controller, Get } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/generated/prisma/enums';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  findAll() {
    return this.auditService.findAll();
  }
}
