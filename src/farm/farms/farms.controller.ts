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
import { UpdateFarmDto } from './dto/UpdateFarm.dto';

import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/generated/prisma/enums';

import type { User } from 'src/generated/prisma/client';
import { GetUser } from 'src/auth/decorator/currentUser.decorator';

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
  create(@GetUser() user: User, @Body() dto: CreateFarmDto) {
    return this.farmService.create(user, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':farmId')
  update(
    @GetUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Body() dto: UpdateFarmDto,
  ) {
    return this.farmService.update(user, farmId, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':farmId')
  remove(@GetUser() user: User, @Param('farmId', ParseUUIDPipe) farmId: string) {
    return this.farmService.remove(user, farmId);
  }
}
