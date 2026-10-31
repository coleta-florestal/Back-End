import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';

import { Role } from 'src/generated/prisma/enums';

import { Roles } from 'src/auth/decorator/roles.decorator';
import { UsersService } from './users.service';

import { ApproveUserDto } from './dto/approve-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

import type { User } from 'src/generated/prisma/client';
import { GetUser } from 'src/auth/decorator/currentUser.decorator';

@Controller('admin/users')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Lista usuários aprovados
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Lista solicitações pendentes
  @Get('pending')
  findPending() {
    return this.usersService.findPending();
  }

  // Busca usuário por nome ou email
  @Get(':identifier')
  findOne(@Param('identifier') identifier: string) {
    return this.usersService.findOne(identifier);
  }

  // Altera o papel do usuário
  @Patch(':id/role')
  updateRole(@GetUser() user: User, @Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.updateRole(user, id, dto);
  }

  // Aprova uma solicitação
  @Patch(':id/approve')
  approve(@GetUser() user: User, @Param('id') id: string, @Body() dto: ApproveUserDto) {
    return this.usersService.approve(user, id, dto);
  }

  // Recusa uma solicitação
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.usersService.reject(id);
  }

  // Ativa uma conta
  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  // Desativa uma conta
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  // Remove permanentemente um usuário
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
