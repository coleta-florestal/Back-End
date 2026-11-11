import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { Role, SubPlotStatus } from 'src/generated/prisma/enums';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getFarmDashboard(farmId: string, user: { id: string; role: Role }) {
    // Verifica se a fazenda existe
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
                  select: { trees: true },
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

    // Verifica a permissão de acesso
    if (user.role === Role.USER && farm.ownerId !== user.id) {
      throw new ForbiddenException('Você não tem permissão para acessar esta fazenda');
    }

    // Busca os indicadores das árvores
    const [treeStats, qualityDistribution] = await Promise.all([
      this.prisma.tree.aggregate({
        where: {
          subPlot: {
            plot: { farmId },
          },
        },
        _count: { _all: true },
        _avg: {
          diameterDapCm: true,
          height: true,
        },
      }),

      this.prisma.tree.groupBy({
        by: ['quality'],
        where: {
          subPlot: {
            plot: { farmId },
          },
        },
        _count: { _all: true },
      }),
    ]);

    // Organiza os dados dos talhões
    const plots = farm.plots.map((plot) => {
      const totalSubPlots = plot.subPlots.length;

      const completedSubPlots = plot.subPlots.filter(
        (subPlot) => subPlot.status === SubPlotStatus.COMPLETED,
      ).length;

      const totalTrees = plot.subPlots.reduce((total, subPlot) => total + subPlot._count.trees, 0);

      const progress = totalSubPlots > 0 ? (completedSubPlots / totalSubPlots) * 100 : 0;

      return {
        id: plot.id,
        name: plot.name,
        status: plot.status,
        totalTrees,
        totalSubPlots,
        completedSubPlots,
        progress: Number(progress.toFixed(2)),
      };
    });

    // Retorna os dados do dashboard
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
      },

      plots,

      qualityDistribution: qualityDistribution.map((item) => ({
        quality: item.quality,
        total: item._count._all,
      })),
    };
  }
}
