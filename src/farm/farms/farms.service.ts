import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateFarmDto } from './dto/CreateFarm.dto';
import { UpdateFarmDto } from './dto/UpdateFarm.dto';

import type { User } from 'src/generated/prisma/client';
import { AuditAction, AuditEntity, Role } from 'src/generated/prisma/enums';
import { AuditService } from '../../admin/audit/audit.service';

@Injectable()
export class FarmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(actor: User, search?: string) {
    const whereClause = search ? { contains: search, mode: 'insensitive' as const } : {};

    return await this.prisma.farm.findMany({
      where: {
        OR: [{ name: whereClause }, { owner: { name: whereClause } }],
        ...(actor.role !== Role.ADMIN &&
          actor.role !== Role.SUPER_ADMIN && {
            userAccesses: {
              some: {
                userId: actor.id,
              },
            },
          }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        owner: { select: { name: true } },
      },
    });
  }

  async findFarm(farmId: string) {
    const farm = await this.prisma.farm.findUnique({
      where: {
        id: farmId,
      },
    });

    if (!farm) {
      throw new NotFoundException({
        message: 'Fazenda não encontrada',
      });
    }

    return farm;
  }

  async findAdmin() {
    return await this.prisma.user.findMany({
      where: {
        OR: [{ role: 'ADMIN' }, { role: 'SUPER_ADMIN' }],
      },
      select: {
        id: true,
        role: true,
        name: true,
      },
    });
  }

  async create(actor: User, dto: CreateFarmDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: dto.ownerId,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const farm = await this.prisma.farm.create({
      data: {
        name: dto.name,
        address: dto.address,
        ownerId: dto.ownerId,
        description: dto.description,
      },
    });

    await this.auditService.create(AuditAction.CREATE, AuditEntity.FARM, actor.id, {
      targetFarmId: farm.id,
      farmName: farm.name,
    });

    return farm;
  }

  async update(actor: User, farmId: string, dto: UpdateFarmDto) {
    const previousFarm = await this.findFarm(farmId);

    const farm = await this.prisma.farm.update({
      where: {
        id: farmId,
      },
      data: {
        name: dto.name,
        address: dto.address,
        description: dto.description,
        ownerId: dto.ownerId,
      },
    });

    await this.auditService.create(AuditAction.UPDATE, AuditEntity.FARM, actor.id, {
      targetFarmId: farm.id,
      previousName: previousFarm.name,
      newName: farm.name,
    });

    return farm;
  }

  async remove(actor: User, farmId: string) {
    const farm = await this.findFarm(farmId);

    await this.prisma.farm.delete({
      where: {
        id: farmId,
      },
    });

    await this.auditService.create(AuditAction.DELETE, AuditEntity.FARM, actor.id, {
      targetFarmId: farm.id,
      farmName: farm.name,
    });

    return { message: 'Fazenda removida com sucesso' };
  }
}
