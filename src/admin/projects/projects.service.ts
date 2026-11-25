import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from '../users/users.service';

import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

import { UserStatus } from 'src/generated/prisma/enums';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async findAll() {
    const farms = await this.prisma.farm.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
        userAccesses: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return farms.map(({ userAccesses, ...farm }) => ({
      ...farm,
      users: userAccesses.map((access) => access.user),
    }));
  }

  async findUsers() {
    return this.usersService.findAll();
  }

  async addUser(farmId: string, userId: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
    });

    if (!farm) {
      throw new NotFoundException('Fazenda não encontrada');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.status !== UserStatus.APPROVED) {
      throw new BadRequestException('Somente usuários aprovados podem acessar fazendas');
    }

    const existingAccess = await this.prisma.userFarm.findUnique({
      where: {
        userId_farmId: {
          userId,
          farmId,
        },
      },
    });

    if (existingAccess) {
      throw new ConflictException('Este usuário já possui acesso à fazenda');
    }

    await this.prisma.userFarm.create({
      data: {
        userId,
        farmId,
      },
    });

    return {
      message: 'Usuário associado à fazenda com sucesso',
    };
  }

  async removeUser(farmId: string, userId: string) {
    const access = await this.prisma.userFarm.findUnique({
      where: {
        userId_farmId: {
          userId,
          farmId,
        },
      },
    });

    if (!access) {
      throw new NotFoundException('Associação entre usuário e fazenda não encontrada');
    }

    await this.prisma.userFarm.delete({
      where: {
        userId_farmId: {
          userId,
          farmId,
        },
      },
    });

    return {
      message: 'Acesso do usuário à fazenda removido com sucesso',
    };
  }
}
