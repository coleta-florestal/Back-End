import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { User } from 'src/generated/prisma/client';
import {
  AccountStatus,
  Role,
  UserStatus,
  AuditAction,
  AuditEntity,
} from 'src/generated/prisma/enums';

import { PrismaService } from 'src/prisma/prisma.service';

import { ApproveUserDto } from './dto/approve-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: {
        status: UserStatus.APPROVED,
      },
      omit: {
        password: true,
      },
      orderBy: {
        name: 'asc',
      },
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

  // Busca usuário por Email ou Nome
  async findOne(identifier: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { name: { contains: identifier, mode: 'insensitive' } }],
        status: UserStatus.APPROVED,
      },
      omit: {
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Altera somente o papel do usuário
  async updateRole(actor: User, id: string, dto: UpdateUserRoleDto) {
    const user = await this.findById(id);

    if (user.status !== UserStatus.APPROVED) {
      throw new ConflictException('User is not approved');
    }

    if (user.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('The SUPER_ADMIN role cannot be changed');
    }

    if (actor.role === Role.ADMIN && dto.role !== Role.USER) {
      throw new ForbiddenException('ADMIN can only assign USER role');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      omit: { password: true },
    });

    await this.auditService.create(AuditAction.UPDATE, AuditEntity.USER, actor.id, {
      targetUserId: id,
      previousRole: user.role,
      newRole: dto.role,
    });

    return updatedUser;
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
      await this.findById(id);

      throw new ConflictException('User does not have a pending request');
    }

    const approvedUser = await this.findById(id);

    await this.auditService.create(AuditAction.APPROVE, AuditEntity.USER, actor.id, {
      targetUserId: id,
      role: dto.role,
    });

    return approvedUser;
  }

  // Recusa uma solicitação de acesso
  async reject(actor: User, id: string) {
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
      await this.findById(id);

      throw new ConflictException('User does not have a pending request');
    }

    await this.auditService.create(AuditAction.REJECT, AuditEntity.USER, actor.id, {
      targetUserId: id,
    });

    return { message: 'User request rejected successfully' };
  }
  // Ativa uma conta
  async activate(actor: User, id: string) {
    return this.changeAccountStatus(actor, id, AccountStatus.ACTIVE);
  }

  // Desativa uma conta
  async deactivate(actor: User, id: string) {
    return this.changeAccountStatus(actor, id, AccountStatus.INACTIVE);
  }

  // Método interno para alterar o status da conta
  private async changeAccountStatus(actor: User, id: string, accountStatus: AccountStatus) {
    const user = await this.findById(id);

    if (user.status !== UserStatus.APPROVED) {
      throw new ConflictException('User is not approved');
    }

    if (user.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('The SUPER_ADMIN account cannot be modified');
    }

    if (user.accountStatus === accountStatus) {
      throw new ConflictException(`User account is already ${accountStatus.toLowerCase()}`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { accountStatus },
      omit: { password: true },
    });

    await this.auditService.create(AuditAction.UPDATE, AuditEntity.USER, actor.id, {
      targetUserId: id,
      previousStatus: user.accountStatus,
      newStatus: accountStatus,
    });

    return updatedUser;
  }

  // Remove permanentemente um usuário
  async remove(actor: User, id: string) {
    const target = await this.findById(id);

    if (target.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('The SUPER_ADMIN cannot be removed');
    }

    if (target.status !== UserStatus.APPROVED) {
      throw new ConflictException('User is not approved');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    await this.auditService.create(AuditAction.DELETE, AuditEntity.USER, actor.id, {
      targetUserId: id,
      name: target.name,
      email: target.email,
      role: target.role,
    });

    return { message: 'User removed successfully' };
  }

  // Busca usuário por ID (uso interno)
  private async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: {
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
