import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateValidationSettingsDto } from './dto/update-validation-settings.dto';

@Injectable()
export class ValidationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne() {
    const settings = await this.prisma.validationSettings.findUnique({ where: { id: 1 } });

    if (!settings) {
      throw new NotFoundException('Os limites de validação ainda não foram configurados');
    }

    return settings;
  }

  async update(dto: UpdateValidationSettingsDto) {
    if (dto.minDapCm >= dto.maxDapCm) {
      throw new BadRequestException('O DAP mínimo deve ser menor que o DAP máximo');
    }

    if (dto.minHeightM >= dto.maxHeightM) {
      throw new BadRequestException('A altura mínima deve ser menor que a altura máxima');
    }

    return this.prisma.validationSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...dto },
      update: dto,
    });
  }
}
