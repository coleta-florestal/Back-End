import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateFarmDto } from './dto/CreateFarm.dto';
import { UpdateFarmDto } from './dto/UpdateFarm.dto';

@Injectable()
export class FarmsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    const whereClause = search ? { contains: search, mode: 'insensitive' as const } : {};

    return await this.prisma.farm.findMany({
      where: {
        OR: [{ name: whereClause }, { owner: { name: whereClause } }],
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

  async create(dto: CreateFarmDto) {
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

    return farm;
  }

  async update(farmId: string, dto: UpdateFarmDto) {
    await this.findFarm(farmId);

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

    return farm;
  }

  async remove(farmId: string) {
    await this.findFarm(farmId);

    await this.prisma.farm.delete({
      where: {
        id: farmId,
      },
    });
  }
}
