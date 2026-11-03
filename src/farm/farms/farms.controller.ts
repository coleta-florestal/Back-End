import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/CreateFarm.dto';

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

}
