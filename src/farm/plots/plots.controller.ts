import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { PlotsService } from './plots.service';
import { CreatePlotDto } from './dto/CreatePlot.dto';

@Controller('farms/:farmId/plots')
export class PlotsController {
  constructor(private readonly plotsService: PlotsService) {}

  @Get()
  findAll(
    @Param('farmId', ParseUUIDPipe) farmId: string, 
    @Query('search') search?: string) {
    return this.plotsService.findAll(farmId, search);
  }

  @Post()
  create(
    @Param('farmId', ParseUUIDPipe) farmId: string, 
    @Body() dto: CreatePlotDto) {
    return this.plotsService.create(farmId, dto);
  }

  @Patch(':plotId')
  update(
    @Param('farmId', ParseUUIDPipe) farmId: string, 
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Body() dto: CreatePlotDto) {
    return this.plotsService.update(farmId, plotId, dto);
  }

  @Delete(':plotId')
  remove(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
  ) {
    return this.plotsService.remove(farmId, plotId);
  }
}
