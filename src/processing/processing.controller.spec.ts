import { Test, TestingModule } from '@nestjs/testing';
import { ProcessingController } from './processing.controller';
import { ProcessingService } from './processing.service';
import { ProcessInventoryDto } from './dto/process-inventory.dto';
import { ProcessPayloadDto } from './dto/process-payload.dto';
import { InventoryProcessingResult } from './types/processing.types';
import { EquationType } from 'src/generated/prisma/enums';

describe('ProcessingController', () => {
  let controller: ProcessingController;

  const mockProcessingResult: InventoryProcessingResult = {
    stage: 'COMPLETED',
    context: {
      plotId: 'plot-1',
      plotName: 'Talhão Teste',
      plotAreaHa: 10,
      equationUsed: {
        id: 'eq-1',
        name: 'Equação Teste',
        modelType: EquationType.SCHUMACHER_HALL,
        beta0: -9.5,
        beta1: 1.8,
        beta2: 0.9,
      },
      processedAt: new Date(),
    },
    totals: {
      totalSubPlotsSampled: 1,
      totalTreesMeasured: 2,
      totalSampleVolumeM3: 0.8,
      meanVolumePerSubPlotM3: 0.8,
      meanVolumePerHaM3: 20,
      meanBasalAreaPerHaM2: 5,
      meanTreesPerHa: 50,
      meanDapCm: 20,
      quadraticMeanDapCm: 20.2,
      meanHeightM: 15,
      estimatedTotalVolumeM3: 200,
      estimatedTotalVolumeLowerM3: 180,
      estimatedTotalVolumeUpperM3: 220,
    },
    statistics: {
      volumePerHa: {
        n: 1,
        total: 20,
        mean: 20,
        variance: 0,
        standardDeviation: 0,
        coefficientOfVariation: 0,
        standardError: 0,
        standardErrorPercent: 0,
        degreesOfFreedom: 1,
        tStudent: 12.706,
        confidenceLevel: 0.95,
        absoluteSamplingError: 0,
        relativeSamplingErrorPercent: 0,
        confidenceIntervalLower: 20,
        confidenceIntervalUpper: 20,
        meetsErrorThreshold: true,
        targetErrorPercent: 10,
      },
      volumePerSubPlot: {
        n: 1,
        total: 0.8,
        mean: 0.8,
        variance: 0,
        standardDeviation: 0,
        coefficientOfVariation: 0,
        standardError: 0,
        standardErrorPercent: 0,
        degreesOfFreedom: 1,
        tStudent: 12.706,
        confidenceLevel: 0.95,
        absoluteSamplingError: 0,
        relativeSamplingErrorPercent: 0,
        confidenceIntervalLower: 0.8,
        confidenceIntervalUpper: 0.8,
        meetsErrorThreshold: true,
        targetErrorPercent: 10,
      },
    },
    qualityDistribution: [],
    diameterClasses: [],
    subPlots: [],
  };

  const mockProcessingService = {
    processPlot: jest.fn(),
    processPayload: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcessingController],
      providers: [
        {
          provide: ProcessingService,
          useValue: mockProcessingService,
        },
      ],
    }).compile();

    controller = module.get<ProcessingController>(ProcessingController);
  });

  describe('processPlot', () => {
    it('delegates to processingService.processPlot with plotId and dto', async () => {
      mockProcessingService.processPlot.mockResolvedValue(mockProcessingResult);

      const dto: ProcessInventoryDto = {
        confidenceLevel: 0.95,
        errorThresholdPercent: 10,
      };

      const result = await controller.processPlot('plot-uuid-1', dto);

      expect(result).toBe(mockProcessingResult);
      expect(mockProcessingService.processPlot).toHaveBeenCalledWith('plot-uuid-1', dto);
    });
  });

  describe('processFarmPlot', () => {
    it('delegates to processingService.processPlot with plotId, dto and farmId', async () => {
      mockProcessingService.processPlot.mockResolvedValue(mockProcessingResult);

      const dto: ProcessInventoryDto = {
        finitePopulation: true,
      };

      const result = await controller.processFarmPlot('farm-uuid-1', 'plot-uuid-1', dto);

      expect(result).toBe(mockProcessingResult);
      expect(mockProcessingService.processPlot).toHaveBeenCalledWith(
        'plot-uuid-1',
        dto,
        'farm-uuid-1',
      );
    });
  });

  describe('processPayload', () => {
    it('delegates to processingService.processPayload', async () => {
      mockProcessingService.processPayload.mockResolvedValue(mockProcessingResult);

      const payloadDto: ProcessPayloadDto = {
        plotName: 'Talhão Simulado',
        subPlots: [],
      };

      const result = await controller.processPayload(payloadDto);

      expect(result).toBe(mockProcessingResult);
      expect(mockProcessingService.processPayload).toHaveBeenCalledWith(payloadDto);
    });
  });

  describe('processSimulate', () => {
    it('delegates to processingService.processPayload (simulation alias)', async () => {
      mockProcessingService.processPayload.mockResolvedValue(mockProcessingResult);

      const payloadDto: ProcessPayloadDto = {
        plotName: 'Talhão Simulado',
        subPlots: [],
      };

      const result = await controller.processSimulate(payloadDto);

      expect(result).toBe(mockProcessingResult);
      expect(mockProcessingService.processPayload).toHaveBeenCalledWith(payloadDto);
    });
  });
});
