import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFarmDto } from './dto/CreateFarm.dto';
import { UpdateFarmDto } from './dto/UpdateFarm.dto';

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

    async findAdmin() {
        return await this.prisma.user.findMany({
            where: {
                OR: [ { role: 'ADMIN' }, { role: 'SUPER_ADMIN' } ] 
            },
            select: {
                id: true,
                role: true,
                name: true
            }
        })
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

    async findById(id: string) {
        const farm = await this.prisma.farm.findUnique({
            where: {
                id: id
            }
        })
        if (!farm) {
            throw new BadRequestException({
                message: "Farm was not found"
            })
        }
        return farm
    }

    async update(id: string, dto: UpdateFarmDto) {
        await this.findById(id)
        
        try {
            const farm = await this.prisma.farm.update({
                where: {
                    id: id
                },
                data: {
                    name: dto.name,
                    address: dto.address,
                    description: dto.description,
                    ownerId: dto.ownerId
                }
            })

            return farm
        } catch(error) {
            throw error
        }
    }

    async remove(id: string) {
        
        await this.prisma.farm.delete({
            where: {
                id: id
            }
        })
    }
}
