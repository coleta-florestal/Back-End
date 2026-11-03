import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/CreateFarm.dto';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/generated/prisma/enums';

@Controller('farms')
export class FarmsController {
    constructor (private readonly farmService: FarmsService) {}

    @Post("")
    create(@Body() dto: CreateFarmDto) {
        return this.farmService.create(dto)
    }

    @Get("")
    findAll(@Query("search") search?: string) {
        return this.farmService.findAll(search)
    }

    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @Delete(":id")
    remove(@Param("id") id: string) {
        return this.farmService.remove(id)
    }
}
