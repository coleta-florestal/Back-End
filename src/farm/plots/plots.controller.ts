import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { PlotsService } from './plots.service';
import { CreatePlotDto } from './dto/CreatePlot.dto';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/generated/prisma/enums';

@Controller('farms/:farmId/plots')
export class PlotsController {
  constructor(private readonly plotsService: PlotsService) {}

  @Get()
  findAll(
    @Param('farmId', ParseUUIDPipe) farmId: string, 
    @Query('search') search?: string) {
    return this.plotsService.findAll(farmId, search);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  create(
    @Param('farmId', ParseUUIDPipe) farmId: string, 
    @Body() dto: CreatePlotDto) {
    return this.plotsService.create(farmId, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':plotId')
  update(
    @Param('farmId', ParseUUIDPipe) farmId: string, 
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Body() dto: CreatePlotDto) {
    return this.plotsService.update(farmId, plotId, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':plotId')
  remove(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
  ) {
    return this.plotsService.remove(farmId, plotId);
  }
}
