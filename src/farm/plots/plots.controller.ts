import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PlotsService } from './plots.service';
import { CreatePlotDto } from './dto/CreatePlot.dto';

@Controller('farms')
export class PlotsController {
    constructor(private readonly plotsService: PlotsService) {}

    @Get(":farmId")
    findAll(@Param("farmId") farmId: string, @Query("search") search?: string) {
        return this.plotsService.findAll(farmId, search)
    }

    @Post(":farmId")
    create(@Param("farmId") farmId: string, @Body() dto: CreatePlotDto) {
        return this.plotsService.create(farmId, dto)
    }
}
