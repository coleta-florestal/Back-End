import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { ProcessingService } from 'src/processing/processing.service';

import { PlotStatus, SubPlotStatus } from 'src/generated/prisma/enums';
import { InventoryProcessingResult } from 'src/processing/types/processing.types';

const PROCESSING_CONCURRENCY = 4;

export interface PlotDashboard {
  id: string;
  name: string;
  status: PlotStatus;
  totalTrees: number;
  totalSubPlots: number;
  completedSubPlots: number;
  progress: number;
  processing: InventoryProcessingResult | null;
  processingError: string | null;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processingService: ProcessingService,
  ) {}

  async getFarmDashboard(farmId: string) {
    const treeWhere = { subPlot: { plot: { farmId } } };

    const [farm, treeStats, qualityDistribution] = await this.prisma.$transaction(async (tx) =>
      Promise.all([
        tx.farm.findUnique({
          where: { id: farmId },
          select: {
            id: true,
            name: true,
            address: true,
            plots: {
              select: {
                id: true,
                name: true,
                status: true,
                subPlots: {
                  select: {
                    id: true,
                    status: true,
                    _count: { select: { trees: true } },
                  },
                },
              },
            },
          },
        }),
        tx.tree.aggregate({
          where: treeWhere,
          _count: { _all: true },
          _avg: { diameterDapCm: true, height: true },
        }),
        tx.tree.groupBy({
          by: ['quality'],
          where: treeWhere,
          orderBy: { quality: 'asc' },
          _count: { _all: true },
        }),
      ]),
    );

    if (!farm) {
      throw new NotFoundException('Fazenda não encontrada');
    }

    // Resolve a equação ativa uma única vez, em vez de uma vez por talhão.
    const activeEquation = await this.prisma.volumetricEquation.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    const plots: PlotDashboard[] = [];

    // Processa em lotes para não disparar todos os talhões ao mesmo tempo.
    for (let i = 0; i < farm.plots.length; i += PROCESSING_CONCURRENCY) {
      const batch = farm.plots.slice(i, i + PROCESSING_CONCURRENCY);

      const results = await Promise.all(
        batch.map((plot) => this.buildPlotDashboard(plot, farmId, activeEquation?.id ?? null)),
      );

      plots.push(...results);
    }

    const processedPlots = plots.filter((plot) => plot.processing !== null);

    const plotsWithEstimatedVolume = processedPlots.filter(
      (plot) =>
        plot.processing?.totals.estimatedTotalVolumeM3 !== null &&
        plot.processing?.totals.estimatedTotalVolumeM3 !== undefined,
    );

    const totalEstimatedVolumeM3 = plotsWithEstimatedVolume.reduce(
      (total, plot) => total + (plot.processing?.totals.estimatedTotalVolumeM3 ?? 0),
      0,
    );

    return {
      farm: {
        id: farm.id,
        name: farm.name,
        address: farm.address,
      },

      summary: {
        totalPlots: farm.plots.length,
        totalTrees: treeStats._count._all,
        averageDap: treeStats._avg.diameterDapCm,
        averageHeight: treeStats._avg.height,
        processedPlots: processedPlots.length,
        plotsWithEstimatedVolume: plotsWithEstimatedVolume.length,
        totalEstimatedVolumeM3,
        // true quando algum talhão ficou fora da soma (erro, sem volume ou sem parcelas concluídas)
        isVolumeTotalPartial: plotsWithEstimatedVolume.length < farm.plots.length,
      },

      plots,

      qualityDistribution: qualityDistribution.map((item) => ({
        quality: item.quality,
        total: item._count._all,
      })),
    };
  }

  private async buildPlotDashboard(
    plot: {
      id: string;
      name: string;
      status: PlotStatus;
      subPlots: { status: SubPlotStatus; _count: { trees: number } }[];
    },
    farmId: string,
    activeEquationId: string | null,
  ): Promise<PlotDashboard> {
    const totalSubPlots = plot.subPlots.length;

    const completedSubPlots = plot.subPlots.filter(
      (subPlot) => subPlot.status === SubPlotStatus.COMPLETED,
    ).length;

    const totalTrees = plot.subPlots.reduce((total, subPlot) => total + subPlot._count.trees, 0);

    const progress = totalSubPlots > 0 ? (completedSubPlots / totalSubPlots) * 100 : 0;

    let processing: InventoryProcessingResult | null = null;
    let processingError: string | null = null;

    if (completedSubPlots === 0) {
      processingError = 'O talhão não possui parcelas concluídas.';
    } else if (!activeEquationId) {
      processingError = 'Nenhuma equação volumétrica ativa no sistema.';
    } else {
      try {
        processing = await this.processingService.processPlot(
          plot.id,
          { equationId: activeEquationId },
          farmId,
        );
      } catch (error) {
        // Falha em um talhão não deve derrubar o dashboard inteiro.
        if (error instanceof BadRequestException || error instanceof NotFoundException) {
          processingError = error.message;
        } else {
          throw error;
        }
      }
    }

    return {
      id: plot.id,
      name: plot.name,
      status: plot.status,
      totalTrees,
      totalSubPlots,
      completedSubPlots,
      progress: Math.round(progress * 100) / 100,
      processing,
      processingError,
    };
  }
}
