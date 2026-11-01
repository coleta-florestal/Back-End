import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { Role } from 'src/generated/prisma/enums';
import { Roles } from 'src/auth/decorator/roles.decorator';

import { EquationsService } from './equations.service';

import { CreateEquationDto } from './dto/create-equation.dto';
import { UpdateEquationDto } from './dto/update-equation.dto';
import { UpdateEquationStatusDto } from './dto/update-equation-status.dto';

@Controller('admin/equations')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class EquationsController {
  constructor(private readonly equationsService: EquationsService) {}

  // Cadastra uma nova equação
  @Post()
  create(@Body() dto: CreateEquationDto) {
    return this.equationsService.create(dto);
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
  update(@Param('id') id: string, @Body() dto: UpdateEquationDto) {
    return this.equationsService.update(id, dto);
  }

  // Atualiza o status de uma equação
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateEquationStatusDto) {
    return this.equationsService.updateStatus(id, dto.isActive);
  }

  // Exclui uma equação
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equationsService.remove(id);
  }
}
