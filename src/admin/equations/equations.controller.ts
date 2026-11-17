import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { Role } from 'src/generated/prisma/enums';
import { Roles } from 'src/auth/decorator/roles.decorator';

import { EquationsService } from './equations.service';

import { CreateEquationDto } from './dto/create-equation.dto';
import { UpdateEquationDto } from './dto/update-equation.dto';
import { UpdateEquationStatusDto } from './dto/update-equation-status.dto';

import { GetUser } from 'src/auth/decorator/currentUser.decorator';
import type { User } from 'src/generated/prisma/client';

@Controller('admin/equations')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class EquationsController {
  constructor(private readonly equationsService: EquationsService) {}

  // Cadastra uma nova equação
  @Post()
  create(@GetUser() user: User, @Body() dto: CreateEquationDto) {
    return this.equationsService.create(user, dto);
  }

  // Lista todas as equações
  @Get()
  findAll() {
    return this.equationsService.findAll();
  }

  // Busca uma equação pelo ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equationsService.findOne(id);
  }

  // Atualiza os dados de uma equação
  @Patch(':id')
  update(@GetUser() user: User, @Param('id') id: string, @Body() dto: UpdateEquationDto) {
    return this.equationsService.update(user, id, dto);
  }

  // Atualiza o status de uma equação
  @Patch(':id/status')
  updateStatus(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateEquationStatusDto,
  ) {
    return this.equationsService.updateStatus(user, id, dto.isActive);
  }

  // Exclui uma equação
  @Delete(':id')
  remove(@GetUser() user: User, @Param('id') id: string) {
    return this.equationsService.remove(user, id);
  }
}
