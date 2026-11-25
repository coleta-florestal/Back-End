import { Body, Controller, Get, Put } from '@nestjs/common';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { GetUser } from 'src/auth/decorator/currentUser.decorator';

import { Role } from 'src/generated/prisma/enums';
import type { User } from 'src/generated/prisma/client';

import { UpdateValidationSettingsDto } from './dto/update-validation-settings.dto';
import { ValidationsService } from './validations.service';

@Controller('admin/validations')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class ValidationsController {
  constructor(private readonly validationsService: ValidationsService) {}

  @Get()
  findOne() {
    return this.validationsService.findOne();
  }

  @Put()
  update(@Body() dto: UpdateValidationSettingsDto, @GetUser() user: User) {
    return this.validationsService.update(user, dto);
  }
}
