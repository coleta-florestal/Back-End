import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { PlotsService } from '../plots/plots.service';

import { SubPlotStatus } from 'src/generated/prisma/enums';

import { CreateSubPlotDto } from './dto/CreateSubPlot.dto';
import { UpdateSubPlotDto } from './dto/UpdateSubPlot.dto';

@Injectable()
export class SubPlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plotService: PlotsService,
  ) {}

  async findAll(farmId: string, plotId: string, search?: string) {
    await this.plotService.findPlot(farmId, plotId);

    const whereClause = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

    return this.prisma.subPlot.findMany({
      where: {
        AND: [whereClause, { plot: { id: plotId, farmId: farmId } }],
      },
    });
  }

  async findSubPlot(farmId: string, plotId: string, subPlotId: string) {
    await this.plotService.findPlot(farmId, plotId);

    const subPlot = await this.prisma.subPlot.findFirst({
      where: {
        AND: [{ id: subPlotId }, { plot: { id: plotId, farmId: farmId } }],
      },
      select: {
        id: true,
        status: true,
        name: true,
        _count: true,
        areaM2: true,
        targetTrees: true,
        trees: true,
        plot: true,
        plotId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!subPlot) {
      throw new NotFoundException({
        message: 'Parcela não encontrada',
      });
    }

    return subPlot;
  }

  async create(farmId: string, plotId: string, dto: CreateSubPlotDto) {
    await this.plotService.findPlot(farmId, plotId);

    return this.prisma.subPlot.create({
      data: {
        plotId: plotId,
        name: dto.name,
        areaM2: dto.areaM2,
        targetTrees: dto.targetTrees,
      },
    });
  }

  async updateStatus(farmId: string, plotId: string, subPlotId: string, status: SubPlotStatus) {
    const subPlot = await this.findSubPlot(farmId, plotId, subPlotId);

    if (subPlot.status === status) {
      throw new ConflictException(
        `A parcela já está ${status === SubPlotStatus.OPEN ? 'aberta' : 'concluída'}.`,
      );
    }

    const missingTrees = Math.max(subPlot.targetTrees - subPlot._count.trees, 0);

    const updatedSubPlot = await this.prisma.subPlot.update({
      where: {
        id: subPlotId,
        plot: { id: plotId, farmId: farmId },
      },
      data: { status: status },
    });

    return {
      subPlot: updatedSubPlot,
      missingTrees,
      warning:
        status === SubPlotStatus.COMPLETED && missingTrees > 0
          ? `A parcela ainda possui ${missingTrees} árvore(s) faltante(s) para atingir a meta.`
          : null,
    };
  }

  async update(farmId: string, plotId: string, subPlotId: string, dto: UpdateSubPlotDto) {
    await this.findSubPlot(farmId, plotId, subPlotId);

    const subPlot = await this.prisma.subPlot.update({
      where: {
        id: subPlotId,
        plot: { id: plotId, farmId: farmId },
      },
      data: {
        name: dto.name,
        targetTrees: dto.targetTrees,
        areaM2: dto.areaM2,
      },
    });

    return subPlot;
  }

  async remove(farmId: string, plotId: string, subPlotId: string) {
    await this.findSubPlot(farmId, plotId, subPlotId);

    await this.prisma.subPlot.delete({
      where: {
        id: subPlotId,
        plot: { id: plotId, farmId: farmId },
      },
    });
  }
}
