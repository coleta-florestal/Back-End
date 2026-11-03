import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubPlotStatus } from 'src/generated/prisma/enums';

import { CreateTreeBatchDto } from './dto/create-tree-batch.dto';
import { UpdateTreeDto } from './dto/update-tree.dto';

@Injectable()
export class TreesService {
  constructor(private readonly prisma: PrismaService) {}

  // Verifica se a parcela existe e está aberta.
  private async validateSubPlot(subPlotId: string) {
    const subPlot = await this.prisma.subPlot.findUnique({
      where: { id: subPlotId },
    });

    if (!subPlot) {
      throw new NotFoundException('Parcela não encontrada.');
    }

    if (subPlot.status !== SubPlotStatus.OPEN) {
      throw new ConflictException('Não é possível alterar árvores de uma parcela concluída.');
    }

    return subPlot;
  }

  // Cadastra várias árvores em uma parcela.
  async createBatch(subPlotId: string, dto: CreateTreeBatchDto) {
    await this.validateSubPlot(subPlotId);

    try {
      // Salva todas as árvores em uma única operação.
      return await this.prisma.$transaction(
        dto.trees.map((tree) =>
          this.prisma.tree.create({
            data: {
              number: tree.number,
              diameterDapCm: tree.diameterDapCm,
              height: tree.height,
              quality: tree.quality,
              observations: tree.observations,
              subPlotId,
            },
          }),
        ),
      );
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // Lista todas as árvores de uma parcela.
  async findAll(subPlotId: string) {
    const subPlot = await this.prisma.subPlot.findUnique({
      where: { id: subPlotId },
    });

    if (!subPlot) {
      throw new NotFoundException('Parcela não encontrada.');
    }

    return this.prisma.tree.findMany({
      where: { subPlotId },
      orderBy: { number: 'asc' },
    });
  }

  // Busca uma árvore pelo ID.
  async findOne(id: string) {
    const tree = await this.prisma.tree.findUnique({
      where: { id },
    });

    if (!tree) {
      throw new NotFoundException('Árvore não encontrada.');
    }

    return tree;
  }

  // Atualiza os dados de uma árvore.
  async update(id: string, dto: UpdateTreeDto) {
    const tree = await this.findOne(id);

    await this.validateSubPlot(tree.subPlotId);

    try {
      return await this.prisma.tree.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // Exclui uma árvore.
  async remove(id: string) {
    const tree = await this.findOne(id);

    await this.validateSubPlot(tree.subPlotId);

    return this.prisma.tree.delete({
      where: { id },
    });
  }

  // Trata erros de identificação duplicada de árvores.
  private handleDatabaseError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Já existe uma árvore com essa identificação nesta parcela.');
    }

    throw error;
  }
}
