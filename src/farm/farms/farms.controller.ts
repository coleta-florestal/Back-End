import { Controller, Get, Query } from '@nestjs/common';
import { FarmsService } from './farms.service';

@Controller('farms')
export class FarmsController {
    constructor (private readonly farmService: FarmsService) {}

    @Get("")
    findAll(@Query("search") search?: string) {
        return this.farmService.findAll(search)
    }
}
