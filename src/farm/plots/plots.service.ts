import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlotDto } from './dto/CreatePlot.dto';
import { FarmsService } from '../farms/farms.service';
import { UpdatePlotDto } from './dto/UpdatePlot.dto';

@Injectable()
export class PlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly farmService: FarmsService,
  ) {}

  async findAll(
    farmId: string, 
    search?: string) {
    await this.farmService.findFarm(farmId);

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

  async findPlot(
    farmId: string, 
    plotId: string) {
    await this.farmService.findFarm(farmId);

    const plot = await this.prisma.plot.findFirst({
      where: {
        AND: [
          { id: plotId }, 
          { farmId: farmId }],
      },
    });

    if (!plot) {
      throw new NotFoundException({
        message: 'Talhão não encontrado',
      });
    }

    return plot;
  }

  async create(
    farmId: string, 
    dto: CreatePlotDto) {
    await this.farmService.findFarm(farmId);

    const plot = await this.prisma.plot.create({
      data: {
        farmId: farmId,
        name: dto.name,
        areaHa: dto.areaHA,
        description: dto.description,
      },
    });

    return plot;
  }

  async update(
    farmId: string, 
    plotId: string, 
    dto: UpdatePlotDto) {
    await this.findPlot(farmId, plotId);

    const plot = await this.prisma.plot.update({
      where: {
        id: plotId,
        farmId: farmId,
      },
      data: {
        name: dto.name,
        areaHa: dto.areaHA,
        description: dto.description,
      },
    });

    return plot;
  }

  async remove(
    farmId: string, 
    plotId: string) {
    await this.findPlot(farmId, plotId);

    await this.prisma.plot.delete({
      where: {
        id: plotId,
      },
    });
  }
}
