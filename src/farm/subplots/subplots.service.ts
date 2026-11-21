import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { PlotsService } from '../plots/plots.service';
import { AuditService } from '../../admin/audit/audit.service';

import type { User } from 'src/generated/prisma/client';

import { PlotStatus, SubPlotStatus, AuditAction, AuditEntity } from 'src/generated/prisma/enums';

import { CreateSubPlotDto } from './dto/CreateSubPlot.dto';
import { UpdateSubPlotDto } from './dto/UpdateSubPlot.dto';

@Injectable()
export class SubPlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plotService: PlotsService,
    private readonly auditService: AuditService,
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

  async create(actor: User, farmId: string, plotId: string, dto: CreateSubPlotDto) {
    const plot = await this.plotService.findPlot(farmId, plotId);

    const subPlot = await this.prisma.subPlot.create({
      data: {
        plotId: plotId,
        name: dto.name,
        areaM2: dto.areaM2,
        targetTrees: dto.targetTrees,
      },
    });

    await this.auditService.create(AuditAction.CREATE, AuditEntity.SUBPLOT, actor.id, {
      targetSubPlotId: subPlot.id,
      subPlotName: subPlot.name,
      plotId: plot.id,
      plotName: plot.name,
      farmId: farmId,
    });

    return subPlot;
  }

  async updateStatus(
    actor: User,
    farmId: string,
    plotId: string,
    subPlotId: string,
    status: SubPlotStatus,
  ) {
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

    const action = status === SubPlotStatus.COMPLETED ? AuditAction.COMPLETE : AuditAction.REOPEN;

    await this.auditService.create(action, AuditEntity.SUBPLOT, actor.id, {
      targetSubPlotId: subPlot.id,
      subPlotName: subPlot.name,
      plotId: plotId,
      plotName: subPlot.plot.name,
      previousStatus: subPlot.status,
      newStatus: updatedSubPlot.status,
      missingTrees: missingTrees,
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

  async update(
    actor: User,
    farmId: string,
    plotId: string,
    subPlotId: string,
    dto: UpdateSubPlotDto,
  ) {
    const previousSubPlot = await this.findSubPlot(farmId, plotId, subPlotId);

    if (previousSubPlot.plot.status === PlotStatus.FINISHED) {
      throw new ForbiddenException('Não é possível editar uma parcela de um talhão finalizado.');
    }

    if (previousSubPlot.status === SubPlotStatus.COMPLETED) {
      throw new ForbiddenException('Não é possível editar uma parcela concluída.');
    }

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

    await this.auditService.create(AuditAction.UPDATE, AuditEntity.SUBPLOT, actor.id, {
      targetSubPlotId: subPlot.id,
      subPlotName: subPlot.name,
      plotId: plotId,
      plotName: previousSubPlot.plot.name,
      previousName: previousSubPlot.name,
      newName: subPlot.name,
    });

    return subPlot;
  }

  async remove(actor: User, farmId: string, plotId: string, subPlotId: string) {
    const subPlot = await this.findSubPlot(farmId, plotId, subPlotId);

    if (subPlot.plot.status === PlotStatus.FINISHED) {
      throw new ForbiddenException('Não é possível excluir uma parcela de um talhão finalizado.');
    }

    if (subPlot.status === SubPlotStatus.COMPLETED) {
      throw new ForbiddenException('Não é possível excluir uma parcela concluída.');
    }

    if (subPlot._count.trees > 0) {
      throw new ForbiddenException(
        'Não é possível excluir uma parcela que possui árvores cadastradas.',
      );
    }

    await this.prisma.subPlot.delete({
      where: {
        id: subPlotId,
        plot: { id: plotId, farmId: farmId },
      },
    });

    await this.auditService.create(AuditAction.DELETE, AuditEntity.SUBPLOT, actor.id, {
      targetSubPlotId: subPlot.id,
      subPlotName: subPlot.name,
      plotId: plotId,
      plotName: subPlot.plot.name,
      farmId: farmId,
    });
  }
}
