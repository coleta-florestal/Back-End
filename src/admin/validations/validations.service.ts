import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateValidationSettingsDto } from './dto/update-validation-settings.dto';

@Injectable()
export class ValidationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne() {
    const settings = await this.prisma.validationSettings.findUnique({ where: { id: 1 } });

    if (!settings) {
      throw new NotFoundException('Validation settings have not been configured');
    }

    return settings;
  }

  async update(dto: UpdateValidationSettingsDto) {
    if (dto.minDapCm >= dto.maxDapCm) {
      throw new BadRequestException('Minimum DAP must be less than maximum DAP');
    }

    if (dto.minHeightM >= dto.maxHeightM) {
      throw new BadRequestException('Minimum height must be less than maximum height');
    }

    return this.prisma.validationSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...dto },
      update: dto,
    });
  }
}
