import { Controller, Get, Param, Query } from '@nestjs/common';
import { PlotsService } from './plots.service';

@Controller('farms')
export class PlotsController {
    constructor(private readonly plotsService: PlotsService) {}

    @Get(":farmId")
    findAll(@Param("farmId") farmId: string, @Query("search") search?: string) {
        return this.plotsService.findAll(farmId, search)
    }
}
