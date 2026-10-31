import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';

import { GetUser } from 'src/auth/decorator/currentUser.decorator';
import { Roles } from 'src/auth/decorator/roles.decorator';

import type { User } from 'src/generated/prisma/client';
import { Role } from 'src/generated/prisma/enums';

import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

import { ApproveUserDto } from './dto/approve-user.dto';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('pending')
  findPending() {
    return this.usersService.findPending();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/role')
  updateRole(
    @GetUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(actor, id, dto);
  }

  @Patch(':id/approve')
  approve(
    @GetUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveUserDto,
  ) {
    return this.usersService.approve(actor, id, dto.role);
  }

  @Patch(':id/reject')
  reject(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.reject(id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
