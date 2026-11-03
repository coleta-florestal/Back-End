import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { TreesService } from './trees.service';
import { CreateTreeBatchDto } from './dto/create-tree-batch.dto';
import { UpdateTreeDto } from './dto/update-tree.dto';

@Controller('trees')
export class TreesController {
  constructor(private readonly treesService: TreesService) {}

  // Cadastra várias árvores em uma parcela.
  @Post('batch/:subPlotId')
  createBatch(@Param('subPlotId') subPlotId: string, @Body() dto: CreateTreeBatchDto) {
    return this.treesService.createBatch(subPlotId, dto);
  }

  // Lista todas as árvores de uma parcela.
  @Get('subplot/:subPlotId')
  findAll(@Param('subPlotId') subPlotId: string) {
    return this.treesService.findAll(subPlotId);
  }

  // Busca uma árvore pelo ID.
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.treesService.findOne(id);
  }

  // Atualiza os dados de uma árvore.
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTreeDto) {
    return this.treesService.update(id, dto);
  }

  // Exclui uma árvore.
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.treesService.remove(id);
  }
}
