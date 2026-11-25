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

import { CreateSubPlotDto } from './dto/CreateSubPlot.dto';
import { UpdateSubPlotStatusDto } from './dto/UpdateSubPlotStatus.dto';
import { UpdateSubPlotDto } from './dto/UpdateSubPlot.dto';

import { GetUser } from 'src/auth/decorator/currentUser.decorator';
import type { User } from 'src/generated/prisma/client';

@Controller('farms/:farmId/plots/:plotId/subplots')
export class SubPlotsController {
  constructor(private readonly subPlotsService: SubPlotsService) {}

  @Post()
  create(
    @GetUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Body() dto: CreateSubPlotDto,
  ) {
    return this.subPlotsService.create(user, farmId, plotId, dto);
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
    @GetUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Param('subPlotId', ParseUUIDPipe) subPlotId: string,
    @Body() dto: UpdateSubPlotStatusDto,
  ) {
    return this.subPlotsService.updateStatus(user, farmId, plotId, subPlotId, dto.status);
  }

  @Patch(':subPlotId')
  update(
    @GetUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Param('subPlotId', ParseUUIDPipe) subPlotId: string,
    @Body() dto: UpdateSubPlotDto,
  ) {
    return this.subPlotsService.update(user, farmId, plotId, subPlotId, dto);
  }

  @Delete(':subPlotId')
  remove(
    @GetUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Param('subPlotId', ParseUUIDPipe) subPlotId: string,
  ) {
    return this.subPlotsService.remove(user, farmId, plotId, subPlotId);
  }
}
