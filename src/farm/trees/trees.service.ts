import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateTreeDto } from './dto/update-tree.dto';
import { CreateTreeDto } from './dto/create-tree.dto';
import { SubPlotsService } from '../subplots/subplots.service';

@Injectable()
export class TreesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subPlotService: SubPlotsService,
  ) {}

  async create(farmId: string, plotId: string, subPlotId: string, dto: CreateTreeDto) {
    await this.subPlotService.findSubPlot(farmId, plotId, subPlotId);

    const tree = await this.prisma.tree.create({
      data: {
        subPlotId: subPlotId,
        name: dto.name,
        diameterDapCm: dto.diameterDapCm,
        height: dto.height,
        quality: dto.quality,
        observations: dto.observations,
      },
    });

    return tree;
  }

  async findAll(farmId: string, plotId: string, subPlotId: string, search?: string) {
    await this.subPlotService.findSubPlot(farmId, plotId, subPlotId);

    const whereClause = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

    return this.prisma.tree.findMany({
      where: {
        AND: [
          whereClause,
          { subPlotId: subPlotId },
          { subPlot: { plotId: plotId } },
          { subPlot: { plot: { farmId: farmId } } },
        ],
      },
    });
  }

  private async findTree(farmId: string, plotId: string, subPlotId: string, treeId: string) {
    await this.subPlotService.findSubPlot(farmId, plotId, subPlotId);

    const tree = await this.prisma.tree.findFirst({
      where: {
        AND: [{ id: treeId }, { subPlotId: subPlotId }],
      },
    });

    if (!tree) {
      throw new BadRequestException({
        message: 'Tree was not found',
      });
    }

    return tree;
  }

  async update(
    farmId: string,
    plotId: string,
    subPlotId: string,
    treeId: string,
    dto: UpdateTreeDto,
  ) {
    await this.findTree(farmId, plotId, subPlotId, treeId);

    return await this.prisma.tree.update({
      where: {
        id: treeId,
        subPlotId: subPlotId,
      },
      data: {
        name: dto.name,
        diameterDapCm: dto.diameterDapCm,
        height: dto.height,
        quality: dto.quality,
        observations: dto.observations,
      },
    });
  }

  async remove(farmId: string, plotId: string, subPlotId: string, treeId: string) {
    await this.findTree(farmId, plotId, subPlotId, treeId);

    await this.prisma.tree.delete({
      where: { id: treeId },
    });
  }
}
