import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';

import { SubPlotsService } from './subplots.service';
import { CreateSubPlotDto } from './dto/create-subplot.dto';
import { UpdateSubPlotStatusDto } from './dto/update-subplot-status.dto';

@Controller('farms/:farmId/plots/:plotId/subplots')
export class SubPlotsController {
  constructor(private readonly subPlotsService: SubPlotsService) {}

  @Post()
  create(@Param('plotId', ParseUUIDPipe) plotId: string, @Body() dto: CreateSubPlotDto) {
    return this.subPlotsService.create(plotId, dto);
  }

  @Get()
  findAll(@Param('plotId', ParseUUIDPipe) plotId: string, @Query("search") search?: string) {
    return this.subPlotsService.findAll(plotId, search);
  }

  @Patch('/status')
  updateStatus(@Param('plotId', ParseUUIDPipe) plotId: string, @Param("subPlotId", ParseUUIDPipe) subtPlotId: string, @Body() dto: UpdateSubPlotStatusDto) {
    return this.subPlotsService.updateStatus(plotId, subtPlotId, dto.status);
  }

  @Delete()
  remove(@Param('plotId', ParseUUIDPipe) plotId: string, @Param("subPlotId", ParseUUIDPipe) subtPlotId: string) {
    return this.subPlotsService.remove(plotId, subtPlotId);
  }
}
