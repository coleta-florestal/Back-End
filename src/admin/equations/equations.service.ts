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

@Injectable()
export class EquationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Valida os coeficientes de acordo com o modelo da equação
  private validateCoefficients(modelType: EquationType, beta2?: number | null) {
    if (modelType === EquationType.SCHUMACHER_HALL && beta2 == null) {
      throw new BadRequestException('The Schumacher & Hall model requires beta2');
    }

    if (modelType !== EquationType.SCHUMACHER_HALL && beta2 != null) {
      throw new BadRequestException('This model does not use beta2');
    }
  }

  // Cadastra uma nova equação volumétrica
  async create(dto: CreateEquationDto) {
    this.validateCoefficients(dto.modelType, dto.beta2);

    return this.prisma.volumetricEquation.create({
      data: {
        ...dto,
        beta2: dto.modelType === EquationType.SCHUMACHER_HALL ? dto.beta2! : null,
      },
    });
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
      throw new NotFoundException('Equation not found');
    }

    return equation;
  }

  // Atualiza os dados de uma equação
  async update(id: string, dto: UpdateEquationDto) {
    const equation = await this.findOne(id);

    const modelType = dto.modelType ?? equation.modelType;

    const beta2 = dto.beta2 !== undefined ? dto.beta2 : equation.beta2;

    this.validateCoefficients(
      modelType,
      modelType === EquationType.SCHUMACHER_HALL ? beta2 : dto.beta2,
    );

    return this.prisma.volumetricEquation.update({
      where: { id },
      data: {
        ...dto,
        beta2: modelType === EquationType.SCHUMACHER_HALL ? beta2 : null,
      },
    });
  }

  // Ativa ou desativa uma equação
  async updateStatus(id: string, isActive: boolean) {
    const equation = await this.findOne(id);

    if (equation.isActive === isActive) {
      throw new ConflictException(`Equation is already ${isActive ? 'active' : 'inactive'}`);
    }

    return this.prisma.volumetricEquation.update({
      where: { id },
      data: { isActive },
    });
  }

  // Exclui uma equação
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.volumetricEquation.delete({
      where: { id },
    });
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
      throw new BadRequestException('DAP must be greater than zero');
    }

    switch (modelType) {
      case EquationType.SCHUMACHER_HALL:
        if (beta2 == null || heightM == null || heightM <= 0) {
          throw new BadRequestException('Schumacher & Hall requires beta2 and a valid tree height');
        }

        return Math.exp(beta0 + beta1 * Math.log(dapCm) + beta2 * Math.log(heightM));

      case EquationType.SPURR:
        if (heightM == null || heightM <= 0) {
          throw new BadRequestException('Spurr requires a valid tree height');
        }

        return beta0 + beta1 * (dapCm ** 2 * heightM);

      case EquationType.HUSCH:
        return Math.exp(beta0 + beta1 * Math.log(dapCm));

      default:
        throw new BadRequestException('Unsupported equation model');
    }
  }
}
