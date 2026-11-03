import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { SubPlotStatus } from 'src/generated/prisma/enums';

import { CreateSubPlotDto } from './dto/create-subplot.dto';

@Injectable()
export class SubPlotsService {
  constructor(private readonly prisma: PrismaService) {}

  // Cria uma nova parcela vinculada a um talhão existente.
  async create(dto: CreateSubPlotDto) {
    const plot = await this.prisma.plot.findUnique({
      where: { id: dto.plotId },
    });

    if (!plot) {
      throw new NotFoundException('Talhão não encontrado.');
    }

    // Cria a parcela com os dados recebidos.
    return this.prisma.subPlot.create({
      data: dto,
    });
  }

  // Retorna todas as parcelas pertencentes a um talhão.
  async findAll(plotId: string) {
    const plot = await this.prisma.plot.findUnique({
      where: { id: plotId },
    });

    if (!plot) {
      throw new NotFoundException('Talhão não encontrado.');
    }

    // Busca as parcelas em ordem crescente de identificação.
    // Também retorna a quantidade de árvores cadastradas em cada parcela.
    return this.prisma.subPlot.findMany({
      where: { plotId },
      orderBy: { number: 'asc' },
      include: {
        _count: {
          select: { trees: true },
        },
      },
    });
  }

  // Busca uma parcela específica pelo seu ID.
  async findOne(id: string) {
    const subPlot = await this.prisma.subPlot.findUnique({
      where: { id },
      include: {
        _count: {
          select: { trees: true },
        },
      },
    });

    if (!subPlot) {
      throw new NotFoundException('Parcela não encontrada.');
    }

    return subPlot;
  }

  // Altera o status de uma parcela, permitindo concluí-la ou reabri-la.
  async updateStatus(id: string, status: SubPlotStatus) {
    const subPlot = await this.findOne(id);

    if (subPlot.status === status) {
      throw new ConflictException(
        `A parcela já está ${status === SubPlotStatus.OPEN ? 'aberta' : 'concluída'}.`,
      );
    }

    // Calcula quantas árvores ainda faltam para atingir a meta.
    const missingTrees = Math.max(subPlot.targetTrees - subPlot._count.trees, 0);

    // Atualiza o status da parcela.
    const updatedSubPlot = await this.prisma.subPlot.update({
      where: { id },
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

  // Exclui uma parcela, desde que ela esteja aberta.
  async remove(id: string) {
    const subPlot = await this.findOne(id);

    // Impede a exclusão de parcelas concluídas.
    if (subPlot.status !== SubPlotStatus.OPEN) {
      throw new ConflictException(
        'Não é possível excluir uma parcela concluída. Reabra a parcela antes de excluí-la.',
      );
    }

    return this.prisma.subPlot.delete({
      where: { id },
    });
  }
}
