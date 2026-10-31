import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { User } from 'src/generated/prisma/client';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Lista usuários aprovados
  findAll() {
    return this.prisma.user.findMany({
      where: { status: UserStatus.APPROVED },
      omit: { password: true },
    });
  }

  // Lista solicitações pendentes
  findPending() {
    return this.prisma.user.findMany({
      where: { status: UserStatus.PENDING },
      omit: { password: true },
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
      throw new ForbiddenException('ADMIN cannot assign elevated roles');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      omit: { password: true },
    });
  }

  // Aprova uma solicitação de acesso
  async approve(actor: User, id: string, role: Role) {
    if (actor.role === Role.ADMIN && role !== Role.USER) {
      throw new ForbiddenException('ADMIN can only approve users as USER');
    }

    const result = await this.prisma.user.updateMany({
      where: {
        id,
        status: UserStatus.PENDING,
      },
      data: {
        status: UserStatus.APPROVED,
        role,
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

  // Remove um usuário aprovado
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
