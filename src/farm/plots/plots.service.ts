import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlotDto } from './dto/CreatePlot.dto';

@Injectable()
export class PlotsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(farmId: string, search?: string) {
    await this.findFarm(farmId);

    const whereClause = search ? { contains: search, mode: 'insensitive' as const } : {};

    return await this.prisma.plot.findMany({
      where: {
        farmId: farmId,
        name: whereClause,
      },
      select: {
        id: true,
        farm: {
          select: {
            id: true,
            name: true,
          },
        },
        name: true,
        areaHa: true,
        status: true,
        description: true,
        createdAt: true,
      },
    });
  }

  private async findFarm(farmId: string) {
    const farm = await this.prisma.farm.findUnique({
      where: {
        id: farmId,
      },
    });

    if (!farm) {
      throw new BadRequestException({
        message: 'Farm not found',
      });
    }

    return farm;
  }

  private async findPlot(plotId: string) {
    const plot = await this.prisma.plot.findUnique({
      where: {
        id: plotId,
      },
    });

    if (!plot) {
      throw new BadRequestException({
        message: 'Plot not found',
      });
    }

    return plot;
  }

  async create(farmId: string, dto: CreatePlotDto) {
    await this.findFarm(farmId);

    const plot = await this.prisma.plot.create({
      data: {
        farmId: farmId,
        name: dto.name,
        areaHa: dto.area,
        description: dto.description,
      },
    });

    return plot;
  }

  async remove(farmId: string, plotId: string) {
    await this.findFarm(farmId);
    await this.findPlot(plotId);

    await this.prisma.plot.delete({
      where: {
        id: plotId,
      },
    });
  }
}
