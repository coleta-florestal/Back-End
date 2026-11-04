import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateTreeDto } from './dto/update-tree.dto';
import { CreateTreeDto } from './dto/create-tree.dto';

@Injectable()
export class TreesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(subPlotId: string, dto: CreateTreeDto) {
    await this.findSubPlot(subPlotId);

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

  async findAll(subPlotId: string, search?: string) {
    await this.findSubPlot(subPlotId);

    const whereClause = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

    return this.prisma.tree.findMany({
      where: {
        AND: [whereClause, { subPlotId: subPlotId }],
      },
    });
  }

  private async findSubPlot(subPlotId: string) {
    const subPlot = await this.prisma.subPlot.findUnique({
      where: {
        id: subPlotId,
      },
    });

    if (!subPlot) {
      throw new BadRequestException({
        message: 'Subplot not found',
      });
    }

    return subPlot;
  }

  private async findTree(subPlotId: string, treeId: string) {
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

  async update(subPlotId: string, treeId: string, dto: UpdateTreeDto) {
    await this.findSubPlot(subPlotId);
    await this.findTree(subPlotId, treeId);

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

  async remove(subPlotId: string, treeId: string) {
    await this.findSubPlot(subPlotId);
    await this.findTree(subPlotId, treeId);

    return this.prisma.tree.delete({
      where: { id: treeId },
    });
  }
}
