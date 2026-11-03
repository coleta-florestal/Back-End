import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';

import { SubPlotsService } from './subplots.service';
import { CreateSubPlotDto } from './dto/create-subplot.dto';
import { UpdateSubPlotStatusDto } from './dto/update-subplot-status.dto';

@Controller('subplots')
export class SubPlotsController {
  constructor(private readonly subPlotsService: SubPlotsService) {}

  // Cria uma parcela.
  @Post()
  create(@Body() dto: CreateSubPlotDto) {
    return this.subPlotsService.create(dto);
  }

  // Lista todas as parcelas de um talhão.
  @Get('plot/:plotId')
  findAll(@Param('plotId', ParseUUIDPipe) plotId: string) {
    return this.subPlotsService.findAll(plotId);
  }

  // Busca uma parcela específica.
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subPlotsService.findOne(id);
  }

  // Conclui ou reabre uma parcela.
  @Patch(':id/status')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSubPlotStatusDto) {
    return this.subPlotsService.updateStatus(id, dto.status);
  }

  // Exclui uma parcela.
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.subPlotsService.remove(id);
  }
}
