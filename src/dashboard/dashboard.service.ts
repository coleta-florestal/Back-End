import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { ProcessingService } from 'src/processing/processing.service';

import { SubPlotStatus } from 'src/generated/prisma/enums';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processingService: ProcessingService,
  ) {}

  async getFarmDashboard(farmId: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
      select: {
        id: true,
        name: true,
        address: true,
        ownerId: true,
        plots: {
          select: {
            id: true,
            name: true,
            status: true,
            subPlots: {
              select: {
                id: true,
                status: true,
                _count: {
                  select: {
                    trees: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!farm) {
      throw new NotFoundException('Fazenda não encontrada');
    }

    // if (user.role === Role.USER && farm.ownerId !== user.id) {
    //   throw new ForbiddenException('Você não tem permissão para acessar esta fazenda');
    // }

    const [treeStats, qualityDistribution] = await Promise.all([
      this.prisma.tree.aggregate({
        where: {
          subPlot: {
            plot: {
              farmId,
            },
          },
        },
        _count: {
          _all: true,
        },
        _avg: {
          diameterDapCm: true,
          height: true,
        },
      }),

      this.prisma.tree.groupBy({
        by: ['quality'],
        where: {
          subPlot: {
            plot: {
              farmId,
            },
          },
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const plots = await Promise.all(
      farm.plots.map(async (plot) => {
        const totalSubPlots = plot.subPlots.length;

        const completedSubPlots = plot.subPlots.filter(
          (subPlot) => subPlot.status === SubPlotStatus.COMPLETED,
        ).length;

        const totalTrees = plot.subPlots.reduce(
          (total, subPlot) => total + subPlot._count.trees,
          0,
        );

        const progress = totalSubPlots > 0 ? (completedSubPlots / totalSubPlots) * 100 : 0;

        let processing: Awaited<ReturnType<ProcessingService['processPlot']>> | null = null;

        let processingError: string | null = null;

        try {
          processing = await this.processingService.processPlot(plot.id, {}, farmId);
        } catch (error) {
          if (error instanceof BadRequestException) {
            processingError = error.message;
          } else {
            throw error;
          }
        }

        return {
          id: plot.id,
          name: plot.name,
          status: plot.status,
          totalTrees,
          totalSubPlots,
          completedSubPlots,
          progress: Number(progress.toFixed(2)),
          processing,
          processingError,
        };
      }),
    );

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
      },

      plots,

      qualityDistribution: qualityDistribution.map((item) => ({
        quality: item.quality,
        total: item._count._all,
      })),
    };
  }
}
