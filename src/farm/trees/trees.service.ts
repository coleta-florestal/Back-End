import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { SubPlotsService } from '../subplots/subplots.service';
import { ValidationsService } from 'src/admin/validations/validations.service';

import { UpdateTreeDto } from './dto/UpdateTree.dto';
import { CreateTreeDto } from './dto/CreateTree.dto';

import { AuditService } from '../../admin/audit/audit.service';
import { AuditAction, AuditEntity, PlotStatus, SubPlotStatus } from 'src/generated/prisma/enums';
import type { User } from 'src/generated/prisma/client';

@Injectable()
export class TreesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subPlotService: SubPlotsService,
    private readonly auditService: AuditService,
    private readonly validationsService: ValidationsService,
  ) {}

  async findAll(farmId: string, plotId: string, subPlotId: string, search?: string) {
    await this.subPlotService.findSubPlot(farmId, plotId, subPlotId);

    const whereClause = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

    return this.prisma.tree.findMany({
      where: {
        AND: [whereClause, { subPlot: { id: subPlotId, plot: { id: plotId, farmId: farmId } } }],
      },
    });
  }

  async findTree(farmId: string, plotId: string, subPlotId: string, treeId: string) {
    await this.subPlotService.findSubPlot(farmId, plotId, subPlotId);

    const tree = await this.prisma.tree.findFirst({
      where: {
        AND: [{ id: treeId }, { subPlot: { id: subPlotId, plot: { id: plotId, farmId: farmId } } }],
      },
      select: {
        subPlot: {
          include: {
            plot: true,
          },
        },
      },
    });

    if (!tree) {
      throw new NotFoundException({
        message: 'Árvore não encontrada',
      });
    }

    return tree;
  }

  async create(actor: User, farmId: string, plotId: string, subPlotId: string, dto: CreateTreeDto) {
    const subPlot = await this.subPlotService.findSubPlot(farmId, plotId, subPlotId);

    if (subPlot.plot.status === PlotStatus.FINISHED) {
      throw new ForbiddenException(
        'O talhão foi finalizado, você não pode adicionar mais árvores.',
      );
    }

    if (subPlot.status === SubPlotStatus.COMPLETED) {
      throw new ForbiddenException(
        'A parcela foi concluída, você não pode adicionar mais árvores.',
      );
    }

    await this.validationsService.validateTreeMeasurements(dto.diameterDapCm, dto.height);

    const tree = await this.prisma.tree.create({
      data: {
        subPlotId: subPlotId,
        name: dto.name,
        diameterDapCm: dto.diameterDapCm,
        height: dto.height,
        quality: dto.quality,
        observations: dto.observations,
      },
    });

    await this.auditService.create(AuditAction.CREATE, AuditEntity.TREE, actor.id, {
      farmId,
      plotId,
      plotName: subPlot.plot.name,
      subPlotId,
      subPlotName: subPlot.name,
    });

    return tree;
  }

  async update(
    actor: User,
    farmId: string,
    plotId: string,
    subPlotId: string,
    treeId: string,
    dto: UpdateTreeDto,
  ) {
    const tree = await this.findTree(farmId, plotId, subPlotId, treeId);

    if (tree.subPlot.plot.status === PlotStatus.FINISHED) {
      throw new ForbiddenException(
        'O talhão foi finalizado, você não pode mais editar as árvores.',
      );
    }

    if (tree.subPlot.status === SubPlotStatus.COMPLETED) {
      throw new ForbiddenException(
        'A parcela foi concluída, você não pode mais editar as árvores.',
      );
    }

    await this.validationsService.validateTreeMeasurements(dto.diameterDapCm, dto.height);

    const updatedTree = await this.prisma.tree.update({
      where: {
        id: treeId,
        subPlot: { id: subPlotId, plot: { id: plotId, farmId: farmId } },
      },
      data: {
        name: dto.name,
        diameterDapCm: dto.diameterDapCm,
        height: dto.height,
        quality: dto.quality,
        observations: dto.observations,
      },
    });

    await this.auditService.create(AuditAction.UPDATE, AuditEntity.TREE, actor.id, {
      farmId,
      plotId,
      plotName: tree.subPlot.plot.name,
      subPlotId,
      subPlotName: tree.subPlot.name,
    });

    return updatedTree;
  }

  async remove(actor: User, farmId: string, plotId: string, subPlotId: string, treeId: string) {
    const tree = await this.findTree(farmId, plotId, subPlotId, treeId);

    if (tree.subPlot.plot.status === PlotStatus.FINISHED) {
      throw new ForbiddenException('O talhão foi finalizado, você não pode mais deletar árvores.');
    }

    if (tree.subPlot.status === SubPlotStatus.COMPLETED) {
      throw new ForbiddenException('A parcela foi concluída, você não pode mais deletar árvores.');
    }

    await this.prisma.tree.delete({
      where: {
        id: treeId,
        subPlot: { id: subPlotId, plot: { id: plotId, farmId: farmId } },
      },
    });

    await this.auditService.create(AuditAction.DELETE, AuditEntity.TREE, actor.id, {
      farmId,
      plotId,
      plotName: tree.subPlot.plot.name,
      subPlotId,
      subPlotName: tree.subPlot.name,
    });
  }
}
