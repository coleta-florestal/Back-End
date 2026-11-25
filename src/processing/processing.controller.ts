import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ProcessingService } from './processing.service';
import { ProcessInventoryDto } from './dto/process-inventory.dto';
import { ProcessPayloadDto } from './dto/process-payload.dto';
import { InventoryProcessingResult } from './types/processing.types';
import { GetUser } from 'src/auth/decorator/currentUser.decorator';
import { Roles } from 'src/auth/decorator/roles.decorator';
import type { User } from 'src/generated/prisma/client';
import { Role } from 'src/generated/prisma/enums';

@Controller('processing')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class ProcessingController {
  constructor(private readonly processingService: ProcessingService) {}

  @Post('plots/:plotId')
  processPlot(
    @GetUser() user: User,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Body() dto: ProcessInventoryDto,
  ): Promise<InventoryProcessingResult> {
    return this.processingService.processPlot(plotId, dto, undefined, { actor: user });
  }

  @Post('farms/:farmId/plots/:plotId')
  processFarmPlot(
    @GetUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Body() dto: ProcessInventoryDto,
  ): Promise<InventoryProcessingResult> {
    return this.processingService.processPlot(plotId, dto, farmId, { actor: user });
  }

  @Post('farms/:farmId')
  processFarm(@Param('farmId', ParseUUIDPipe) farmId: string, @Body() dto: ProcessInventoryDto) {
    return this.processingService.processFarm(farmId, dto);
  }

  @Post('payload')
  processPayload(@Body() dto: ProcessPayloadDto): Promise<InventoryProcessingResult> {
    return this.processingService.processPayload(dto);
  }

  @Post('simulate')
  processSimulate(@Body() dto: ProcessPayloadDto): Promise<InventoryProcessingResult> {
    return this.processingService.processPayload(dto);
  }
}
