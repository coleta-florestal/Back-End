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

import { SubPlotsService } from './subplots.service';
import { CreateSubPlotDto } from './dto/create-subplot.dto';
import { UpdateSubPlotStatusDto } from './dto/update-subplot-status.dto';
import { UpdateSubPlotDto } from './dto/UpdateSubPlot.dto';

@Controller('farms/:farmId/plots/:plotId/subplots')
export class SubPlotsController {
  constructor(private readonly subPlotsService: SubPlotsService) {}

  @Post()
  create(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Body() dto: CreateSubPlotDto,
  ) {
    return this.subPlotsService.create(farmId, plotId, dto);
  }

  @Get()
  findAll(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Query('search') search?: string,
  ) {
    return this.subPlotsService.findAll(farmId, plotId, search);
  }

  @Patch(':subPlotId/status')
  updateStatus(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Param('subPlotId', ParseUUIDPipe) subtPlotId: string,
    @Body() dto: UpdateSubPlotStatusDto,
  ) {
    return this.subPlotsService.updateStatus(farmId, plotId, subtPlotId, dto.status);
  }

  @Patch(':subPlotId')
  update(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Param('subPlotId', ParseUUIDPipe) subtPlotId: string,
    @Body() dto: UpdateSubPlotDto,
  ) {
    return this.subPlotsService.update(farmId, plotId, subtPlotId, dto)
  }

  @Delete(':subPlotId')
  remove(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Param('subPlotId', ParseUUIDPipe) subtPlotId: string,
  ) {
    return this.subPlotsService.remove(farmId, plotId, subtPlotId);
  }
}
