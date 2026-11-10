import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ProcessingService } from './processing.service';
import { ProcessInventoryDto } from './dto/process-inventory.dto';
import { ProcessPayloadDto } from './dto/process-payload.dto';
import { InventoryProcessingResult } from './types/processing.types';

@Controller('processing')
export class ProcessingController {
  constructor(private readonly processingService: ProcessingService) {}

  /**
   * Processa o inventário de um talhão persistido no banco de dados.
   */
  @Post('plots/:plotId')
  processPlot(
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Body() dto: ProcessInventoryDto,
  ): Promise<InventoryProcessingResult> {
    return this.processingService.processPlot(plotId, dto);
  }

  /**
   * Processa o inventário de um talhão vinculado a uma fazenda específica.
   */
  @Post('farms/:farmId/plots/:plotId')
  processFarmPlot(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Body() dto: ProcessInventoryDto,
  ): Promise<InventoryProcessingResult> {
    return this.processingService.processPlot(plotId, dto, farmId);
  }

  /**
   * Processa os dados de inventário enviados diretamente via payload (ex: simulação/preview).
   */
  @Post('payload')
  processPayload(@Body() dto: ProcessPayloadDto): Promise<InventoryProcessingResult> {
    return this.processingService.processPayload(dto);
  }

  /**
   * Alias de simulação para processamento direto via payload.
   */
  @Post('simulate')
  processSimulate(@Body() dto: ProcessPayloadDto): Promise<InventoryProcessingResult> {
    return this.processingService.processPayload(dto);
  }
}
