import { Body, Controller, Get, Put } from '@nestjs/common';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
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
  update(@Body() dto: UpdateValidationSettingsDto) {
    return this.validationsService.update(dto);
  }
}
