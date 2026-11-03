import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FarmsService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(search?: string) {
        const whereClause = search ? {
            name: {
                contains: search, 
                mode: "insensitive" as const
            }
        } : {}

        return await this.prisma.farm.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            }
        })
    }
}
