import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { EquationType } from 'src/generated/prisma/enums';

import { CreateEquationDto } from './dto/create-equation.dto';
import { UpdateEquationDto } from './dto/update-equation.dto';

import type { User } from 'src/generated/prisma/client';
import { AuditAction, AuditEntity } from 'src/generated/prisma/enums';

import { AuditService } from 'src/admin/audit/audit.service';

@Injectable()
export class EquationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // Valida os coeficientes de acordo com o modelo da equação
  validateCoefficients(modelType: EquationType, beta2?: number | null) {
    if (modelType === EquationType.SCHUMACHER_HALL && beta2 == null) {
      throw new BadRequestException('O modelo Schumacher e Hall requer beta2');
    }

    if (modelType !== EquationType.SCHUMACHER_HALL && beta2 != null) {
      throw new BadRequestException('Esse modelo não usa beta2');
    }
  }

  // Cadastra uma nova equação volumétrica
  async create(actor: User, dto: CreateEquationDto) {
    this.validateCoefficients(dto.modelType, dto.beta2);

    const equation = await this.prisma.volumetricEquation.create({
      data: {
        name: dto.name,
        modelType: dto.modelType,
        beta0: dto.beta0,
        beta1: dto.beta1,
        beta2: dto.modelType === EquationType.SCHUMACHER_HALL ? dto.beta2! : null,
      },
    });

    await this.auditService.create(AuditAction.CREATE, AuditEntity.EQUATION, actor.id, {
      equationId: equation.id,
      name: equation.name,
      modelType: equation.modelType,
      beta0: equation.beta0,
      beta1: equation.beta1,
      beta2: equation.beta2,
    });

    return equation;
  }

  // Retorna todas as equações cadastradas
  async findAll() {
    return this.prisma.volumetricEquation.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // Busca uma equação pelo ID
  async findOne(id: string) {
    const equation = await this.prisma.volumetricEquation.findUnique({
      where: { id },
    });

    if (!equation) {
      throw new NotFoundException('Equação não encontrada');
    }

    return equation;
  }

  // Atualiza os dados de uma equação
  async update(actor: User, id: string, dto: UpdateEquationDto) {
    const equation = await this.findOne(id);

    const modelType = dto.modelType ?? equation.modelType;

    const beta2 = dto.beta2 !== undefined ? dto.beta2 : equation.beta2;

    this.validateCoefficients(
      modelType,
      modelType === EquationType.SCHUMACHER_HALL ? beta2 : dto.beta2,
    );

    const updatedEquation = await this.prisma.volumetricEquation.update({
      where: { id },
      data: {
        name: dto.name ?? equation.name,
        modelType: dto.modelType ?? equation.modelType,
        beta0: dto.beta0 ?? equation.beta0,
        beta1: dto.beta1 ?? equation.beta1,
        beta2: modelType === EquationType.SCHUMACHER_HALL ? beta2 : null,
      },
    });

    await this.auditService.create(AuditAction.UPDATE, AuditEntity.EQUATION, actor.id, {
      equationId: id,
      previous: {
        name: equation.name,
        modelType: equation.modelType,
        beta0: equation.beta0,
        beta1: equation.beta1,
        beta2: equation.beta2,
      },
      current: {
        name: updatedEquation.name,
        modelType: updatedEquation.modelType,
        beta0: updatedEquation.beta0,
        beta1: updatedEquation.beta1,
        beta2: updatedEquation.beta2,
      },
    });

    return updatedEquation;
  }

  // Ativa ou desativa uma equação
  async updateStatus(actor: User, id: string, isActive: boolean) {
    const equation = await this.findOne(id);

    if (equation.isActive === isActive) {
      throw new ConflictException(`A equação já está ${isActive ? 'ativa' : 'inativa'}`);
    }

    const updatedEquation = await this.prisma.volumetricEquation.update({
      where: { id },
      data: { isActive },
    });

    await this.auditService.create(AuditAction.UPDATE, AuditEntity.EQUATION, actor.id, {
      equationId: id,
      name: equation.name,
      previousStatus: equation.isActive,
      newStatus: updatedEquation.isActive,
    });

    return updatedEquation;
  }

  // Exclui uma equação
  async remove(actor: User, id: string) {
    const equation = await this.findOne(id);

    const deletedEquation = await this.prisma.volumetricEquation.delete({
      where: { id },
    });

    await this.auditService.create(AuditAction.DELETE, AuditEntity.EQUATION, actor.id, {
      equationId: id,
      name: equation.name,
      modelType: equation.modelType,
      beta0: equation.beta0,
      beta1: equation.beta1,
      beta2: equation.beta2,
    });

    return deletedEquation;
  }

  // Calcula o volume da árvore utilizando a equação selecionada
  calculateVolume(
    modelType: EquationType,
    beta0: number,
    beta1: number,
    beta2: number | null,
    dapCm: number,
    heightM?: number,
  ): number {
    if (dapCm <= 0) {
      throw new BadRequestException('O DAP deve ser maior que zero');
    }

    switch (modelType) {
      case EquationType.SCHUMACHER_HALL:
        if (beta2 == null || heightM == null || heightM <= 0) {
          throw new BadRequestException(
            'Schumacher e Hall requer beta2 e uma altura válida da árvore',
          );
        }

        return Math.exp(beta0 + beta1 * Math.log(dapCm) + beta2 * Math.log(heightM));

      case EquationType.SPURR:
        if (heightM == null || heightM <= 0) {
          throw new BadRequestException('Spurr requer uma altura válida da árvore');
        }

        return beta0 + beta1 * (dapCm ** 2 * heightM);

      case EquationType.HUSCH:
        return Math.exp(beta0 + beta1 * Math.log(dapCm));

      default:
        throw new BadRequestException('Modelo de equação não suportado');
    }
  }
}
