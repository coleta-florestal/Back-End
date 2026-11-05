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

@Controller('farms/:farmId/plots/:plotId/subplots/:subPlotId/tree')
export class TreesController {
  constructor(private readonly treesService: TreesService) {}

  @Post()
  create(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Param('subPlotId', ParseUUIDPipe) subPlotId: string,
    @Body() dto: CreateTreeDto,
  ) {
    return this.treesService.create(farmId, plotId, subPlotId, dto);
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
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Param('subPlotId', ParseUUIDPipe) subPlotId: string,
    @Param('treeId', ParseUUIDPipe) treeId: string,
    @Body() dto: UpdateTreeDto,
  ) {
    return this.treesService.update(farmId, plotId, subPlotId, treeId, dto);
  }

  @Delete(':treeId')
  remove(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Param('subPlotId', ParseUUIDPipe) subPlotId: string,
    @Param('treeId', ParseUUIDPipe) treeId: string,
  ) {
    return this.treesService.remove(farmId, plotId, subPlotId, treeId);
  }
}
