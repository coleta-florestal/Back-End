import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PlotsService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(farmId: string, search?: string) {
        await this.findOne(farmId)

        const whereClause = search ? { contains: search, mode: "insensitive" as const } : {}

        return await this.prisma.plot.findMany({
            where: {
                farmId: farmId,
                name: whereClause
            }
        })
    }

    private async findOne(farmId: string) {
        const farm = await this.prisma.farm.findUnique({
            where: {
                id: farmId
            }
        })

        if (!farm) {
            throw new BadRequestException({
                message: "Farm not found"
            })
        }

        return farm 
    }
}
