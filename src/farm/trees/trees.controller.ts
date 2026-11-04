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
  create(@Param('subPlotId') subPlotId: string, @Body() dto: CreateTreeDto) {
    return this.treesService.create(subPlotId, dto);
  }

  @Get()
  findAll(@Param('subPlotId') subPlotId: string, @Query('search') search?: string) {
    return this.treesService.findAll(subPlotId, search);
  }

  @Patch(':treeId')
  update(
    @Param('subplotId', ParseUUIDPipe) subPlotId: string,
    @Param('treeId', ParseUUIDPipe) treeId: string,
    @Body() dto: UpdateTreeDto,
  ) {
    return this.treesService.update(subPlotId, treeId, dto);
  }

  @Delete(':treeId')
  remove(
    @Param('subplotId', ParseUUIDPipe) subPlotId: string,
    @Param('treeId', ParseUUIDPipe) treeId: string,
  ) {
    return this.treesService.remove(subPlotId, treeId);
  }
}
