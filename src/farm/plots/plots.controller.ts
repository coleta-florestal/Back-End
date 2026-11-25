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

import { PlotsService } from './plots.service';
import { CreatePlotDto } from './dto/CreatePlot.dto';
import { UpdatePlotDto } from './dto/UpdatePlot.dto';

import { Roles } from 'src/auth/decorator/roles.decorator';
import { GetUser } from 'src/auth/decorator/currentUser.decorator';

import { Role } from 'src/generated/prisma/enums';
import type { User } from 'src/generated/prisma/client';

@Controller('farms/:farmId/plots')
export class PlotsController {
  constructor(private readonly plotsService: PlotsService) {}

  @Get()
  findAll(@Param('farmId', ParseUUIDPipe) farmId: string, @Query('search') search?: string) {
    return this.plotsService.findAll(farmId, search);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  create(
    @GetUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Body() dto: CreatePlotDto,
  ) {
    return this.plotsService.create(user, farmId, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':plotId')
  update(
    @GetUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Body() dto: UpdatePlotDto,
  ) {
    return this.plotsService.update(user, farmId, plotId, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':plotId')
  remove(
    @GetUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
  ) {
    return this.plotsService.remove(user, farmId, plotId);
  }
}
