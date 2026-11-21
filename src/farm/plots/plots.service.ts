import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { FarmsService } from '../farms/farms.service';
import { AuditService } from '../../admin/audit/audit.service';

import type { User } from 'src/generated/prisma/client';
import { AuditAction, AuditEntity } from 'src/generated/prisma/enums';

import { CreatePlotDto } from './dto/CreatePlot.dto';
import { UpdatePlotDto } from './dto/UpdatePlot.dto';

@Injectable()
export class PlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly farmService: FarmsService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(farmId: string, search?: string) {
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

  async findPlot(farmId: string, plotId: string) {
    await this.farmService.findFarm(farmId);

    const plot = await this.prisma.plot.findFirst({
      where: {
        AND: [{ id: plotId }, { farmId: farmId }],
      },
    });

    if (!plot) {
      throw new NotFoundException({
        message: 'Talhão não encontrado',
      });
    }

    return plot;
  }

  async create(actor: User, farmId: string, dto: CreatePlotDto) {
    const farm = await this.farmService.findFarm(farmId);

    const existingPlot = await this.prisma.plot.findFirst({
      where: {
        farmId,
        name: { equals: dto.name.trim(), mode: 'insensitive' },
      },
    });

    if (existingPlot) {
      throw new ConflictException('Já existe um talhão com este nome na fazenda.');
    }

    const plot = await this.prisma.plot.create({
      data: {
        farmId: farmId,
        name: dto.name,
        areaHa: dto.areaHA,
        description: dto.description,
      },
    });

    await this.auditService.create(AuditAction.CREATE, AuditEntity.PLOT, actor.id, {
      targetPlotId: plot.id,
      plotName: plot.name,
      farmId: farm.id,
      farmName: farm.name,
    });

    return plot;
  }

  async update(actor: User, farmId: string, plotId: string, dto: UpdatePlotDto) {
    const previousPlot = await this.findPlot(farmId, plotId);

    if (dto.name) {
      const existingPlot = await this.prisma.plot.findFirst({
        where: {
          farmId,
          name: { equals: dto.name.trim(), mode: 'insensitive' },
          id: { not: plotId },
        },
      });

      if (existingPlot) {
        throw new ConflictException('Já existe um talhão com este nome na fazenda.');
      }
    }

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

    await this.auditService.create(AuditAction.UPDATE, AuditEntity.PLOT, actor.id, {
      targetPlotId: plot.id,
      farmId: farmId,
      previousName: previousPlot.name,
      newName: plot.name,
    });

    return plot;
  }

  async remove(actor: User, farmId: string, plotId: string) {
    const plot = await this.findPlot(farmId, plotId);

    await this.prisma.plot.delete({
      where: {
        id: plotId,
        farmId: farmId,
      },
    });

    await this.auditService.create(AuditAction.DELETE, AuditEntity.PLOT, actor.id, {
      targetPlotId: plot.id,
      plotName: plot.name,
      farmId: farmId,
    });

    return { message: 'Talhão removido com sucesso' };
  }
}
