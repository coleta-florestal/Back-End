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
import { UpdateTreeDto } from './dto/update-tree.dto';
import { CreateTreeDto } from './dto/create-tree.dto';

@Controller('farms/:farmId/plots/:plotsId/subplots/:subPlotId/tree')
export class TreesController {
  constructor(private readonly treesService: TreesService) {}

  @Post()
  create(
    @Param('farmId') farmId: string,
    @Param('plotId') plotId: string,
    @Param('subPlotId') subPlotId: string,
    @Body() dto: CreateTreeDto,
  ) {
    return this.treesService.create(farmId, plotId, subPlotId, dto);
  }

  @Get()
  findAll(
    @Param('farmId') farmId: string,
    @Param('plotId') plotId: string,
    @Param('subPlotId') subPlotId: string,
    @Query('search') search?: string,
  ) {
    return this.treesService.findAll(farmId, plotId, subPlotId, search);
  }

  @Patch(':treeId')
  update(
    @Param('farmId') farmId: string,
    @Param('plotId') plotId: string,
    @Param('subplotId', ParseUUIDPipe) subPlotId: string,
    @Param('treeId', ParseUUIDPipe) treeId: string,
    @Body() dto: UpdateTreeDto,
  ) {
    return this.treesService.update(farmId, plotId, subPlotId, treeId, dto);
  }

  @Delete(':treeId')
  remove(
    @Param('farmId') farmId: string,
    @Param('plotId') plotId: string,
    @Param('subplotId', ParseUUIDPipe) subPlotId: string,
    @Param('treeId', ParseUUIDPipe) treeId: string,
  ) {
    return this.treesService.remove(farmId, plotId, subPlotId, treeId);
  }
}
