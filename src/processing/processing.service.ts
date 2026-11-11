import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EquationsService } from 'src/admin/equations/equations.service';
import { StatisticsService } from './statistics.service';
import { EquationType, SubPlotStatus, TreeQuality } from 'src/generated/prisma/enums';
import { ProcessInventoryDto } from './dto/process-inventory.dto';
import { ProcessPayloadDto } from './dto/process-payload.dto';
import {
  InventoryProcessingResult,
  ProcessingEquationContext,
  SubPlotProcessingResult,
  TreeProcessingResult,
} from './types/processing.types';

interface PipelineSubPlotInput {
  id?: string;
  name: string;
  areaM2?: number;
  trees: Array<{
    id?: string;
    name?: string;
    diameterDapCm: number;
    heightM?: number | null;
    quality?: TreeQuality;
    observations?: string;
  }>;
}

interface PipelineContextInput {
  farmId?: string;
  farmName?: string;
  plotId?: string;
  plotName: string;
  plotAreaHa?: number | null;
}

@Injectable()
export class ProcessingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly equationsService: EquationsService,
    private readonly statisticsService: StatisticsService,
  ) {}

  /**
   * Processa o inventário de um talhão persistido no banco de dados.
   */
  async processPlot(
    plotId: string,
    dto: ProcessInventoryDto = {},
    farmId?: string,
  ): Promise<InventoryProcessingResult> {
    const plot = await this.prisma.plot.findUnique({
      where: { id: plotId },
      include: {
        farm: true,
        subPlots: {
          include: {
            trees: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!plot) {
      throw new NotFoundException(`Talhão com ID ${plotId} não encontrado.`);
    }

    if (farmId && plot.farmId !== farmId) {
      throw new BadRequestException(`O talhão ${plotId} não pertence à fazenda ${farmId}.`);
    }

    if (!plot.subPlots || plot.subPlots.length === 0) {
      throw new BadRequestException('O talhão não possui parcelas cadastradas para processamento.');
    }

    const completedSubPlots = plot.subPlots.filter((sp) => sp.status === SubPlotStatus.COMPLETED);

    if (completedSubPlots.length === 0) {
      throw new BadRequestException(
        'O talhão não possui parcelas concluídas. Conclua ao menos uma parcela para processar o inventário.',
      );
    }

    const equationContext = await this.resolveEquationContext(dto);

    const subPlotsInput: PipelineSubPlotInput[] = completedSubPlots.map((sp) => ({
      id: sp.id,
      name: sp.name,
      areaM2: sp.areaM2 ?? undefined,
      trees: sp.trees.map((t) => ({
        id: t.id,
        name: t.name,
        diameterDapCm: t.diameterDapCm,
        heightM: t.height,
        quality: t.quality,
        observations: t.observations ?? undefined,
      })),
    }));

    return this.executePipeline(
      {
        farmId: plot.farmId,
        farmName: plot.farm?.name,
        plotId: plot.id,
        plotName: plot.name,
        plotAreaHa: plot.areaHa,
      },
      equationContext,
      subPlotsInput,
      dto,
    );
  }

  /**
   * Processa os dados de inventário passados diretamente no corpo da requisição (payload).
   */
  async processPayload(dto: ProcessPayloadDto): Promise<InventoryProcessingResult> {
    if (!dto.subPlots || dto.subPlots.length === 0) {
      throw new BadRequestException('Nenhuma parcela informada no payload para processamento.');
    }

    const equationContext = await this.resolveEquationContext(dto);

    return this.executePipeline(
      {
        plotName: dto.plotName || 'Talhão Simulado',
        plotAreaHa: dto.plotAreaHa,
      },
      equationContext,
      dto.subPlots,
      dto,
    );
  }

  /**
   * Resolve a equação volumétrica a ser utilizada:
   * 1. Equação customizada informada no DTO
   * 2. Equação cadastrada buscada pelo ID
   * 3. Equação ativa padrão cadastrada no sistema
   */
  private async resolveEquationContext(
    dto: ProcessInventoryDto,
  ): Promise<ProcessingEquationContext> {
    if (dto.equation) {
      this.validateCustomEquationCoefficients(dto.equation.modelType, dto.equation.beta2);
      return {
        name: dto.equation.name || `Equação Customizada (${dto.equation.modelType})`,
        modelType: dto.equation.modelType,
        beta0: dto.equation.beta0,
        beta1: dto.equation.beta1,
        beta2: dto.equation.beta2 ?? null,
      };
    }

    if (dto.equationId) {
      const eq = await this.prisma.volumetricEquation.findUnique({
        where: { id: dto.equationId },
      });

      if (!eq) {
        throw new NotFoundException(`Equação volumétrica ${dto.equationId} não encontrada.`);
      }

      if (!eq.isActive) {
        throw new BadRequestException(`A equação volumétrica ${dto.equationId} está inativa.`);
      }

      return {
        id: eq.id,
        name: eq.name,
        modelType: eq.modelType,
        beta0: eq.beta0,
        beta1: eq.beta1,
        beta2: eq.beta2,
      };
    }

    const activeEquation = await this.prisma.volumetricEquation.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeEquation) {
      throw new BadRequestException(
        'Nenhuma equação volumétrica informada e nenhuma ativa no sistema.',
      );
    }

    return {
      id: activeEquation.id,
      name: activeEquation.name,
      modelType: activeEquation.modelType,
      beta0: activeEquation.beta0,
      beta1: activeEquation.beta1,
      beta2: activeEquation.beta2,
    };
  }

  private validateCustomEquationCoefficients(modelType: EquationType, beta2?: number | null) {
    if (modelType === EquationType.SCHUMACHER_HALL && beta2 == null) {
      throw new BadRequestException('O modelo Schumacher e Hall requer beta2');
    }

    if (modelType !== EquationType.SCHUMACHER_HALL && beta2 != null) {
      throw new BadRequestException('Esse modelo não usa beta2');
    }
  }

  /**
   * Executa o fluxo completo do pipeline de processamento florestal:
   * Árvore -> Validação -> Volume -> Parcela -> Amostra -> Hectare -> Estatística -> Resultado
   */
  private executePipeline(
    contextInput: PipelineContextInput,
    equation: ProcessingEquationContext,
    subPlotsInput: PipelineSubPlotInput[],
    dto: ProcessInventoryDto,
  ): InventoryProcessingResult {
    const limits = dto.validationLimits;
    const subPlotsResults: SubPlotProcessingResult[] = [];
    const allProcessedTrees: TreeProcessingResult[] = [];

    // Etapas: Árvore -> Validação -> Volume -> Parcela
    for (const subPlot of subPlotsInput) {
      const areaM2 = subPlot.areaM2 || dto.defaultParcelaAreaM2;

      if (!areaM2 || areaM2 <= 0) {
        throw new BadRequestException(
          `Área da parcela "${subPlot.name}" não informada. Forneça areaM2 na parcela ou defaultParcelaAreaM2.`,
        );
      }

      const processedTrees: TreeProcessingResult[] = [];

      for (const tree of subPlot.trees || []) {
        let isValid = true;
        const warnings: string[] = [];

        // 1. Validação básica de DAP
        if (tree.diameterDapCm <= 0) {
          isValid = false;
          warnings.push('DAP deve ser maior que zero');
        }

        // 2. Validações contra limites configurados
        if (limits?.minDapCm != null && tree.diameterDapCm < limits.minDapCm) {
          isValid = false;
          warnings.push(`DAP abaixo do limite mínimo (${limits.minDapCm} cm)`);
        }
        if (limits?.maxDapCm != null && tree.diameterDapCm > limits.maxDapCm) {
          isValid = false;
          warnings.push(`DAP acima do limite máximo (${limits.maxDapCm} cm)`);
        }

        if (tree.heightM != null) {
          if (tree.heightM <= 0) {
            isValid = false;
            warnings.push('Altura deve ser maior que zero');
          }
          if (limits?.minHeightM != null && tree.heightM < limits.minHeightM) {
            isValid = false;
            warnings.push(`Altura abaixo do limite mínimo (${limits.minHeightM} m)`);
          }
          if (limits?.maxHeightM != null && tree.heightM > limits.maxHeightM) {
            isValid = false;
            warnings.push(`Altura acima do limite máximo (${limits.maxHeightM} m)`);
          }
        }

        // 3. Exigência de altura pelo modelo da equação
        if (
          equation.modelType === EquationType.SCHUMACHER_HALL ||
          equation.modelType === EquationType.SPURR
        ) {
          if (tree.heightM == null || tree.heightM <= 0) {
            isValid = false;
            warnings.push('Altura obrigatória para o modelo de equação selecionado');
          }
        }

        // 4. Área basal da árvore: g = pi * (dap/100)^2 / 4 = pi * dap^2 / 40000
        const basalAreaM2 =
          isValid && tree.diameterDapCm > 0
            ? (Math.PI * Math.pow(tree.diameterDapCm, 2)) / 40000
            : 0;

        // 5. Cálculo do volume individual
        let volumeM3 = 0;
        if (isValid) {
          try {
            volumeM3 = this.equationsService.calculateVolume(
              equation.modelType,
              equation.beta0,
              equation.beta1,
              equation.beta2 ?? null,
              tree.diameterDapCm,
              tree.heightM ?? undefined,
            );

            if (isNaN(volumeM3) || volumeM3 < 0) {
              volumeM3 = 0;
              isValid = false;
              warnings.push('Cálculo de volume resultou em valor inválido');
            }
          } catch (err: unknown) {
            volumeM3 = 0;
            isValid = false;
            const message =
              err instanceof Error ? err.message : 'Erro no cálculo do volume da árvore';
            warnings.push(message);
          }
        }

        const treeResult: TreeProcessingResult = {
          id: tree.id,
          name: tree.name,
          diameterDapCm: tree.diameterDapCm,
          heightM: tree.heightM ?? null,
          quality: tree.quality || TreeQuality.NORMAL,
          volumeM3,
          basalAreaM2,
          isValid,
          warnings: warnings.length > 0 ? warnings : undefined,
        };

        processedTrees.push(treeResult);
        allProcessedTrees.push(treeResult);
      }

      // Parcela -> Hectare
      const treeCount = processedTrees.length;
      const validTreeCount = processedTrees.filter((t) => t.isValid).length;
      const totalVolumeM3 = processedTrees.reduce((acc, t) => acc + t.volumeM3, 0);
      const totalBasalAreaM2 = processedTrees.reduce((acc, t) => acc + t.basalAreaM2, 0);

      const expansionFactor = 10000 / areaM2;
      const volumePerHa = totalVolumeM3 * expansionFactor;
      const basalAreaPerHa = totalBasalAreaM2 * expansionFactor;
      const treesPerHa = validTreeCount * expansionFactor;

      const treesWithDap = processedTrees.filter((t) => t.isValid && t.diameterDapCm > 0);
      const meanDapCm =
        treesWithDap.length > 0
          ? treesWithDap.reduce((acc, t) => acc + t.diameterDapCm, 0) / treesWithDap.length
          : 0;

      const validHeights = processedTrees
        .filter((t) => t.isValid)
        .map((t) => t.heightM)
        .filter((h): h is number => h != null && h > 0);

      const meanHeightM =
        validHeights.length > 0
          ? validHeights.reduce((acc, h) => acc + h, 0) / validHeights.length
          : null;

      subPlotsResults.push({
        id: subPlot.id,
        name: subPlot.name,
        areaM2,
        treeCount,
        validTreeCount,
        totalVolumeM3,
        volumePerHa,
        totalBasalAreaM2,
        basalAreaPerHa,
        treesPerHa,
        meanDapCm,
        meanHeightM,
        trees: dto.includeTreesInResult ? processedTrees : undefined,
      });
    }

    // Etapas: Amostra -> Hectare -> Estatística
    const totalSubPlots = subPlotsResults.length;
    const meanSubPlotAreaM2 =
      totalSubPlots > 0
        ? subPlotsResults.reduce((acc, sp) => acc + sp.areaM2, 0) / totalSubPlots
        : 0;

    const populationSize =
      contextInput.plotAreaHa && contextInput.plotAreaHa > 0 && meanSubPlotAreaM2 > 0
        ? (contextInput.plotAreaHa * 10000) / meanSubPlotAreaM2
        : undefined;

    const statOptions = {
      confidenceLevel: dto.confidenceLevel ?? 0.95,
      targetErrorPercent: dto.errorThresholdPercent ?? 10,
      finitePopulation: dto.finitePopulation ?? false,
      populationSize,
    };

    const volumePerHaStats = this.statisticsService.calculateSamplingStatistics(
      subPlotsResults.map((sp) => sp.volumePerHa),
      statOptions,
    );

    const volumePerSubPlotStats = this.statisticsService.calculateSamplingStatistics(
      subPlotsResults.map((sp) => sp.totalVolumeM3),
      statOptions,
    );

    // Totais e Médias Consolidadas
    const totalTreesMeasured = allProcessedTrees.length;
    const totalValidTreesMeasured = allProcessedTrees.filter((t) => t.isValid).length;
    const totalSampleVolumeM3 = subPlotsResults.reduce((acc, sp) => acc + sp.totalVolumeM3, 0);

    const meanVolumePerSubPlotM3 = totalSubPlots > 0 ? totalSampleVolumeM3 / totalSubPlots : 0;
    const meanVolumePerHaM3 = volumePerHaStats.mean;
    const meanBasalAreaPerHaM2 =
      totalSubPlots > 0
        ? subPlotsResults.reduce((acc, sp) => acc + sp.basalAreaPerHa, 0) / totalSubPlots
        : 0;
    const meanTreesPerHa =
      totalSubPlots > 0
        ? subPlotsResults.reduce((acc, sp) => acc + sp.treesPerHa, 0) / totalSubPlots
        : 0;

    const allValidTrees = allProcessedTrees.filter((t) => t.isValid);
    const allTreesWithDap = allValidTrees.filter((t) => t.diameterDapCm > 0);
    const meanDapCm =
      allTreesWithDap.length > 0
        ? allTreesWithDap.reduce((acc, t) => acc + t.diameterDapCm, 0) / allTreesWithDap.length
        : 0;

    const quadraticMeanDapCm = this.statisticsService.calculateQuadraticMean(
      allTreesWithDap.map((t) => t.diameterDapCm),
    );

    const allValidHeights = allValidTrees
      .map((t) => t.heightM)
      .filter((h): h is number => h != null && h > 0);

    const meanHeightM =
      allValidHeights.length > 0
        ? allValidHeights.reduce((acc, h) => acc + h, 0) / allValidHeights.length
        : null;

    const estimatedTotalVolumeM3 =
      contextInput.plotAreaHa && contextInput.plotAreaHa > 0
        ? meanVolumePerHaM3 * contextInput.plotAreaHa
        : null;

    const estimatedTotalVolumeLowerM3 =
      contextInput.plotAreaHa && contextInput.plotAreaHa > 0
        ? volumePerHaStats.confidenceIntervalLower * contextInput.plotAreaHa
        : null;

    const estimatedTotalVolumeUpperM3 =
      contextInput.plotAreaHa && contextInput.plotAreaHa > 0
        ? volumePerHaStats.confidenceIntervalUpper * contextInput.plotAreaHa
        : null;

    // Distribuições
    const qualityDistribution = this.statisticsService.calculateQualityClasses(
      allValidTrees.map((t) => ({
        quality: String(t.quality),
        volumeM3: t.volumeM3,
      })),
    );

    const diameterClasses = this.statisticsService.calculateDiameterClasses(
      allValidTrees.map((t) => ({
        diameterDapCm: t.diameterDapCm,
        volumeM3: t.volumeM3,
      })),
    );

    return {
      stage: 'COMPLETED',
      context: {
        farmId: contextInput.farmId,
        farmName: contextInput.farmName,
        plotId: contextInput.plotId,
        plotName: contextInput.plotName,
        plotAreaHa: contextInput.plotAreaHa ?? null,
        equationUsed: equation,
        processedAt: new Date(),
      },
      totals: {
        totalSubPlotsSampled: totalSubPlots,
        totalTreesMeasured,
        totalValidTreesMeasured,
        totalSampleVolumeM3,
        meanVolumePerSubPlotM3,
        meanVolumePerHaM3,
        meanBasalAreaPerHaM2,
        meanTreesPerHa,
        meanDapCm,
        quadraticMeanDapCm,
        meanHeightM,
        estimatedTotalVolumeM3,
        estimatedTotalVolumeLowerM3,
        estimatedTotalVolumeUpperM3,
      },
      statistics: {
        volumePerHa: volumePerHaStats,
        volumePerSubPlot: volumePerSubPlotStats,
      },
      qualityDistribution,
      diameterClasses,
      subPlots: subPlotsResults,
    };
  }
}
