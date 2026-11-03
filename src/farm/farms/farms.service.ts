import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFarmDto } from './dto/CreateFarm.dto';

@Injectable()
export class FarmsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateFarmDto) {
        const farm = await this.prisma.farm.create({
            data: {
                name: dto.name,
                address: dto.address,
                ownerId: dto.ownerId,
                description: dto.description
            }
        })
        return farm
    }

    async findAll(search?: string) {
        const whereClause = search ? { contains: search, mode: "insensitive" as const } : {}

        return await this.prisma.farm.findMany({
            where: {
                OR: [{ name: whereClause }, { owner: { name: whereClause } }]
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                owner: { select: { name: true } }
            }
        })
    }
}
