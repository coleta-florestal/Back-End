import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { User } from 'src/generated/prisma/client';
import { AccountStatus, Role, UserStatus } from 'src/generated/prisma/enums';

import { PrismaService } from 'src/prisma/prisma.service';

import { ApproveUserDto } from './dto/approve-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Lista usuários aprovados e permite busca por nome ou email
  findAll(search?: string) {
    const term = search?.trim();

    return this.prisma.user.findMany({
      where: {
        status: UserStatus.APPROVED,
        ...(term
          ? {
              OR: [
                {
                  name: {
                    contains: term,
                    mode: 'insensitive',
                  },
                },
                {
                  email: {
                    contains: term,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      omit: { password: true },
      orderBy: { name: 'asc' },
    });
  }

  // Lista solicitações pendentes
  findPending() {
    return this.prisma.user.findMany({
      where: { status: UserStatus.PENDING },
      omit: { password: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Busca usuário por ID
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Altera somente o papel do usuário
  async updateRole(actor: User, id: string, dto: UpdateUserRoleDto) {
    const target = await this.findOne(id);

    if (target.status !== UserStatus.APPROVED) {
      throw new ConflictException('User is not approved');
    }

    if (target.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('The SUPER_ADMIN role cannot be changed');
    }

    if (actor.role === Role.ADMIN && dto.role !== Role.USER) {
      throw new ForbiddenException('ADMIN can only assign USER role');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      omit: { password: true },
    });
  }

  // Aprova uma solicitação de acesso
  async approve(actor: User, id: string, dto: ApproveUserDto) {
    if (actor.role === Role.ADMIN && dto.role !== Role.USER) {
      throw new ForbiddenException('ADMIN can only approve users as USER');
    }

    const result = await this.prisma.user.updateMany({
      where: {
        id,
        status: UserStatus.PENDING,
      },
      data: {
        status: UserStatus.APPROVED,
        accountStatus: AccountStatus.ACTIVE,
        role: dto.role,
      },
    });

    if (result.count === 0) {
      await this.findOne(id);

      throw new ConflictException('User does not have a pending request');
    }

    return this.findOne(id);
  }

  // Recusa uma solicitação de acesso
  async reject(id: string) {
    const result = await this.prisma.user.updateMany({
      where: {
        id,
        status: UserStatus.PENDING,
      },
      data: {
        status: UserStatus.REJECTED,
      },
    });

    if (result.count === 0) {
      await this.findOne(id);

      throw new ConflictException('User does not have a pending request');
    }

    return { message: 'User request rejected successfully' };
  }

  // Ativa uma conta
  async activate(id: string) {
    return this.changeAccountStatus(id, AccountStatus.ACTIVE);
  }

  // Desativa uma conta
  async deactivate(id: string) {
    return this.changeAccountStatus(id, AccountStatus.INACTIVE);
  }

  // Método interno para alterar o status da conta
  private async changeAccountStatus(id: string, accountStatus: AccountStatus) {
    const target = await this.findOne(id);

    if (target.status !== UserStatus.APPROVED) {
      throw new ConflictException('User is not approved');
    }

    if (target.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('The SUPER_ADMIN account cannot be modified');
    }

    if (target.accountStatus === accountStatus) {
      throw new ConflictException(`User account is already ${accountStatus.toLowerCase()}`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { accountStatus },
      omit: { password: true },
    });
  }

  // Remove permanentemente um usuário
  async remove(id: string) {
    const target = await this.findOne(id);

    if (target.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('The SUPER_ADMIN cannot be removed');
    }

    if (target.status !== UserStatus.APPROVED) {
      throw new ConflictException('User is not approved');
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }
}
