import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { PlotsService } from './plots.service';
import { CreatePlotDto } from './dto/CreatePlot.dto';

@Controller('farms/:farmId/plots')
export class PlotsController {
    constructor(private readonly plotsService: PlotsService) {}

    @Get()
    findAll(@Param("farmId") farmId: string, @Query("search") search?: string) {
        return this.plotsService.findAll(farmId, search)
    }

    @Post()
    create(@Param("farmId") farmId: string, @Body() dto: CreatePlotDto) {
        return this.plotsService.create(farmId, dto)
    }

    @Delete(":plotId")
    remove(@Param("farmId") farmId: string, @Param("plotId") plotId: string) {
        return this.plotsService.remove(farmId, plotId)
    }
}
