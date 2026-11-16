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

import { TreesService } from './trees.service';

import { UpdateTreeDto } from './dto/UpdateTree.dto';
import { CreateTreeDto } from './dto/CreateTree.dto';

import { GetUser } from 'src/auth/decorator/currentUser.decorator';
import type { User } from 'src/generated/prisma/client';

@Controller('farms/:farmId/plots/:plotId/subplots/:subPlotId/trees')
export class TreesController {
  constructor(private readonly treesService: TreesService) {}

  @Post()
  create(
    @GetUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Param('subPlotId', ParseUUIDPipe) subPlotId: string,
    @Body() dto: CreateTreeDto,
  ) {
    return this.treesService.create(user, farmId, plotId, subPlotId, dto);
  }

  @Get()
  findAll(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Param('subPlotId', ParseUUIDPipe) subPlotId: string,
    @Query('search') search?: string,
  ) {
    return this.treesService.findAll(farmId, plotId, subPlotId, search);
  }

  @Patch(':treeId')
  update(
    @GetUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Param('subPlotId', ParseUUIDPipe) subPlotId: string,
    @Param('treeId', ParseUUIDPipe) treeId: string,
    @Body() dto: UpdateTreeDto,
  ) {
    return this.treesService.update(user, farmId, plotId, subPlotId, treeId, dto);
  }

  @Delete(':treeId')
  remove(
    @GetUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Param('subPlotId', ParseUUIDPipe) subPlotId: string,
    @Param('treeId', ParseUUIDPipe) treeId: string,
  ) {
    return this.treesService.remove(user, farmId, plotId, subPlotId, treeId);
  }
}
