import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { SubPlotStatus } from 'src/generated/prisma/enums';

import { CreateSubPlotDto } from './dto/create-subplot.dto';
import { PlotsService } from '../plots/plots.service';
import { UpdateSubPlotDto } from './dto/UpdateSubPlot.dto';

@Injectable()
export class SubPlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plotService: PlotsService,
  ) {}

  async create(
    farmId: string, 
    plotId: string, 
    dto: CreateSubPlotDto) {
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

  async findAll(
    farmId: string, 
    plotId: string, 
    search?: string) {
    await this.plotService.findPlot(farmId, plotId);

    const whereClause = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

    return this.prisma.subPlot.findMany({
      where: {
        AND: [
          whereClause, 
          { plotId: plotId }, 
          { plot: { farmId: farmId } }],
      },
    });
  }

  async findSubPlot(
    farmId: string, 
    plotId: string, 
    subPlotId: string) {
    await this.plotService.findPlot(farmId, plotId);

    const subPlot = await this.prisma.subPlot.findFirst({
      where: {
        AND: [
          { id: subPlotId }, 
          { plotId: plotId }, 
          { plot: { farmId: farmId } }],
      },
      select: {
        trees: true,
        targetTrees: true,
        id: true,
        name: true,
        status: true,
        areaM2: true,
        createdAt: true,
        plot: true,
        plotId: true,
        updatedAt: true,
        _count: true,
      },
    });

    if (!subPlot) {
      throw new NotFoundException({
        message: 'Parcela não encontrada',
      });
    }

    return subPlot;
  }

  async updateStatus(
    farmId: string, 
    plotId: string, 
    subPlotId: string, 
    status: SubPlotStatus) {
    const subPlot = await this.findSubPlot(farmId, plotId, subPlotId);

    if (subPlot.status === status) {
      throw new ConflictException(
        `A parcela já está ${status === SubPlotStatus.OPEN ? 'aberta' : 'concluída'}.`,
      );
    }

    const missingTrees = Math.max(subPlot.targetTrees - subPlot._count.trees, 0);

    // Atualiza o status da parcela.
    const updatedSubPlot = await this.prisma.subPlot.update({
      where: { id: subPlotId },
      data: { status },
    });

    // Retorna a parcela atualizada e informa se existem árvores faltantes.
    return {
      subPlot: updatedSubPlot,
      missingTrees,
      warning:
        status === SubPlotStatus.COMPLETED && missingTrees > 0
          ? `A parcela ainda possui ${missingTrees} árvore(s) faltante(s) para atingir a meta.`
          : null,
    };
  }

  async update(
    farmId: string, 
    plotId: string, 
    subPlotId: string, 
    dto: UpdateSubPlotDto) {
    await this.findSubPlot(farmId, plotId, subPlotId);

    const subPlot = await this.prisma.subPlot.update({
      where: {
        id: subPlotId,
        plotId: plotId,
        plot: { farmId: farmId },
      },
      data: {
        name: dto.name,
        targetTrees: dto.targetTrees,
        areaM2: dto.areaM2,
      },
    });

    return subPlot;
  }

  async remove(
    farmId: string, 
    plotId: string, 
    subPlotId: string) {
    await this.findSubPlot(farmId, plotId, subPlotId);

    await this.prisma.subPlot.delete({
      where: { id: subPlotId },
    });
  }
}
