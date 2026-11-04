import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { SubPlotStatus } from 'src/generated/prisma/enums';

import { CreateSubPlotDto } from './dto/create-subplot.dto';

@Injectable()
export class SubPlotsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(plotId: string, dto: CreateSubPlotDto) {
    await this.findPlot(plotId);

    return this.prisma.subPlot.create({
      data: {
        plotId: plotId,
        name: dto.name,
        areaM2: dto.areaM2,
        targetTrees: dto.targetTrees,
      },
    });
  }

  async findAll(plotId: string, search?: string) {
    const whereClause = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

    return this.prisma.subPlot.findMany({
      where: {
        AND: [whereClause, { plotId: plotId }],
      },
    });
  }

  private async findPlot(plotId: string) {
    const plot = await this.prisma.plot.findUnique({
      where: { id: plotId },
    });

    if (!plot) {
      throw new NotFoundException('Talhão não encontrado.');
    }

    return plot;
  }

  private async findSubPlot(plotId: string, subPlotId: string) {
    const subPlot = await this.prisma.subPlot.findFirst({
      where: {
        AND: [{ id: subPlotId }, { plotId: plotId }],
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
      throw new BadRequestException({
        message: 'Subplot was not found',
      });
    }

    return subPlot;
  }

  async updateStatus(plotId: string, subPlotId: string, status: SubPlotStatus) {
    const subPlot = await this.findSubPlot(plotId, subPlotId);

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

  async remove(plotId: string, subPlotId: string) {
    await this.findSubPlot(plotId, subPlotId);

    return this.prisma.subPlot.delete({
      where: { id: subPlotId },
    });
  }
}
