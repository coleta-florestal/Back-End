import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import type { User } from 'src/generated/prisma/client';
import { Role } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({ omit: { password: true } });
  }

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

  async update(actor: User, id: string, dto: UpdateUserDto) {
    const target = await this.findOne(id);

    if (target.role === Role.SUPER_ADMIN) {
      if (actor.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException('Only SUPER_ADMIN can change SUPER_ADMIN role');
      }

      if (dto.role !== undefined) {
        throw new ForbiddenException('The SUPER_ADMIN role can not be changed');
      }
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: dto,
        omit: { password: true },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This e-mail is already in use');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const target = await this.findOne(id);

    if (target.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('The SUPER_ADMIN can not be removed');
    }

    await this.prisma.user.delete({ where: { id } });
  }
}
