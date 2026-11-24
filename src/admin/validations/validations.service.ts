import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateValidationSettingsDto } from './dto/update-validation-settings.dto';

import type { User } from 'src/generated/prisma/client';
import { AuditAction, AuditEntity } from 'src/generated/prisma/enums';

import { AuditService } from 'src/admin/audit/audit.service';

@Injectable()
export class ValidationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findOne() {
    const settings = await this.prisma.validationSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      throw new NotFoundException('Os limites de validação ainda não foram configurados');
    }

    return settings;
  }

  async update(actor: User, dto: UpdateValidationSettingsDto) {
    if (dto.minDapCm >= dto.maxDapCm) {
      throw new BadRequestException('O DAP mínimo deve ser menor que o DAP máximo');
    }

    if (dto.minHeightM >= dto.maxHeightM) {
      throw new BadRequestException('A altura mínima deve ser menor que a altura máxima');
    }

    const previousSettings = await this.prisma.validationSettings.findUnique({
      where: { id: 1 },
    });

    const updatedSettings = await this.prisma.validationSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...dto },
      update: dto,
    });

    const hasChanges =
      !previousSettings ||
      previousSettings.minDapCm !== updatedSettings.minDapCm ||
      previousSettings.maxDapCm !== updatedSettings.maxDapCm ||
      previousSettings.minHeightM !== updatedSettings.minHeightM ||
      previousSettings.maxHeightM !== updatedSettings.maxHeightM;

    if (hasChanges) {
      await this.auditService.create(
        AuditAction.UPDATE,
        AuditEntity.VALIDATION_SETTINGS,
        actor.id,
        {
          previous: previousSettings
            ? {
                minDapCm: previousSettings.minDapCm,
                maxDapCm: previousSettings.maxDapCm,
                minHeightM: previousSettings.minHeightM,
                maxHeightM: previousSettings.maxHeightM,
              }
            : null,
          current: {
            minDapCm: updatedSettings.minDapCm,
            maxDapCm: updatedSettings.maxDapCm,
            minHeightM: updatedSettings.minHeightM,
            maxHeightM: updatedSettings.maxHeightM,
          },
        },
      );
    }

    return updatedSettings;
  }

  async validateTreeMeasurements(diameterDapCm?: number, height?: number) {
    const settings = await this.prisma.validationSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      return;
    }

    if (
      diameterDapCm !== undefined &&
      (diameterDapCm < settings.minDapCm || diameterDapCm > settings.maxDapCm)
    ) {
      throw new BadRequestException(
        `DAP deve estar entre ${settings.minDapCm} cm e ${settings.maxDapCm} cm.`,
      );
    }

    if (height !== undefined && (height < settings.minHeightM || height > settings.maxHeightM)) {
      throw new BadRequestException(
        `Altura deve estar entre ${settings.minHeightM} m e ${settings.maxHeightM} m.`,
      );
    }
  }
}
