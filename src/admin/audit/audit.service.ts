import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { AuditAction, AuditEntity } from 'src/generated/prisma/enums';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async create(
    action: AuditAction,
    entity: AuditEntity,
    userId?: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entity,
        userId,
        ...(metadata !== undefined && { metadata }),
      },
    });
  }

  async findAll() {
    return this.prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
