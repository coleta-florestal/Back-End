import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/CreateFarm.dto';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
import { UpdateFarmDto } from './dto/UpdateFarm.dto';

@Controller('farms')
export class FarmsController {
  constructor(private readonly farmService: FarmsService) {}

  @Get('')
  findAll(@Query('search') search?: string) {
    return this.farmService.findAll(search);
  }

  @Get('admin_owners')
  getAdminOwners() {
    return this.farmService.findAdmin();
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('')
  create(@Body() dto: CreateFarmDto) {
    return this.farmService.create(dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':famrId')
  update(@Param('farmId', ParseUUIDPipe) farmId: string, @Body() dto: UpdateFarmDto) {
    return this.farmService.update(farmId, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':farmId')
  remove(@Param('farmId', ParseUUIDPipe) farmId: string) {
    return this.farmService.remove(farmId);
  }
}
