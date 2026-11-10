import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { EquationsService } from 'src/admin/equations/equations.service';
import { StatisticsService } from './statistics.service';
import { ProcessingService } from './processing.service';
import { EquationType, TreeQuality } from 'src/generated/prisma/enums';
import { ProcessInventoryDto } from './dto/process-inventory.dto';
import { ProcessPayloadDto } from './dto/process-payload.dto';

describe('ProcessingService', () => {
  let service: ProcessingService;
  let equationsService: EquationsService;

  const mockPrisma = {
    plot: {
      findUnique: jest.fn(),
    },
    volumetricEquation: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const sampleDbEquation = {
    id: 'eq-1111-uuid',
    name: 'Schumacher & Hall Padrão',
    modelType: EquationType.SCHUMACHER_HALL,
    beta0: -9.5,
    beta1: 1.8,
    beta2: 0.9,
    isActive: true,
  };

  const samplePlotFromDb = {
    id: 'plot-1234-uuid',
    name: 'Talhão A1',
    areaHa: 10.5,
    farmId: 'farm-0001-uuid',
    farm: {
      id: 'farm-0001-uuid',
      name: 'Fazenda Santa Maria',
    },
    subPlots: [
      {
        id: 'sp-1',
        name: 'Parcela 1',
        areaM2: 400,
        trees: [
          {
            id: 't-1',
            name: 'Árvore 1',
            diameterDapCm: 20,
            height: 15,
            quality: TreeQuality.NORMAL,
            observations: null,
          },
          {
            id: 't-2',
            name: 'Árvore 2',
            diameterDapCm: 25,
            height: 18,
            quality: TreeQuality.NORMAL,
            observations: null,
          },
        ],
      },
      {
        id: 'sp-2',
        name: 'Parcela 2',
        areaM2: 400,
        trees: [
          {
            id: 't-3',
            name: 'Árvore 3',
            diameterDapCm: 22,
            height: 16,
            quality: TreeQuality.BIFURCADA,
            observations: 'Bifurcada abaixo do DAP',
          },
          {
            id: 't-4',
            name: 'Árvore 4',
            diameterDapCm: 28,
            height: 20,
            quality: TreeQuality.NORMAL,
            observations: null,
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessingService,
        StatisticsService,
        EquationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProcessingService>(ProcessingService);
    equationsService = module.get<EquationsService>(EquationsService);
  });

  describe('processPlot', () => {
    it('successfully processes a plot from DB using active equation as fallback', async () => {
      mockPrisma.plot.findUnique.mockResolvedValue(samplePlotFromDb);
      mockPrisma.volumetricEquation.findFirst.mockResolvedValue(sampleDbEquation);

      const result = await service.processPlot('plot-1234-uuid', {
        includeTreesInResult: true,
      });

      expect(result.stage).toBe('COMPLETED');
      expect(result.context.plotId).toBe('plot-1234-uuid');
      expect(result.context.plotName).toBe('Talhão A1');
      expect(result.context.farmName).toBe('Fazenda Santa Maria');
      expect(result.context.equationUsed.name).toBe(sampleDbEquation.name);

      // Totais e parcelas
      expect(result.totals.totalSubPlotsSampled).toBe(2);
      expect(result.totals.totalTreesMeasured).toBe(4);
      expect(result.totals.totalSampleVolumeM3).toBeGreaterThan(0);
      expect(result.totals.meanVolumePerHaM3).toBeGreaterThan(0);
      expect(result.totals.estimatedTotalVolumeM3).toBeGreaterThan(0);

      // SubPlots
      expect(result.subPlots.length).toBe(2);
      expect(result.subPlots[0].trees).toBeDefined();
      expect(result.subPlots[0].trees?.length).toBe(2);
      expect(result.subPlots[0].trees?.[0].isValid).toBe(true);

      // Estatísticas de amostragem
      expect(result.statistics.volumePerHa.n).toBe(2);
      expect(result.statistics.volumePerSubPlot.n).toBe(2);

      // Distribuição de qualidade
      expect(result.qualityDistribution.length).toBeGreaterThanOrEqual(1);
      const normalClass = result.qualityDistribution.find((q) => q.quality === 'NORMAL');
      expect(normalClass?.treeCount).toBe(3);

      // Classes diamétricas
      expect(result.diameterClasses.length).toBeGreaterThanOrEqual(1);
    });

    it('uses custom equation passed in DTO', async () => {
      mockPrisma.plot.findUnique.mockResolvedValue(samplePlotFromDb);

      const dto: ProcessInventoryDto = {
        equation: {
          name: 'Husch Local',
          modelType: EquationType.HUSCH,
          beta0: -7.5,
          beta1: 2.1,
        },
      };

      const result = await service.processPlot('plot-1234-uuid', dto);

      expect(result.context.equationUsed.name).toBe('Husch Local');
      expect(result.context.equationUsed.modelType).toBe(EquationType.HUSCH);
      expect(mockPrisma.volumetricEquation.findFirst).not.toHaveBeenCalled();
    });

    it('uses equation specified by equationId', async () => {
      mockPrisma.plot.findUnique.mockResolvedValue(samplePlotFromDb);
      mockPrisma.volumetricEquation.findUnique.mockResolvedValue(sampleDbEquation);

      const dto: ProcessInventoryDto = {
        equationId: 'eq-1111-uuid',
      };

      const result = await service.processPlot('plot-1234-uuid', dto);

      expect(result.context.equationUsed.id).toBe('eq-1111-uuid');
      expect(mockPrisma.volumetricEquation.findUnique).toHaveBeenCalledWith({
        where: { id: 'eq-1111-uuid' },
      });
    });

    it('throws NotFoundException when plot does not exist', async () => {
      mockPrisma.plot.findUnique.mockResolvedValue(null);

      await expect(service.processPlot('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when plot does not belong to specified farmId', async () => {
      mockPrisma.plot.findUnique.mockResolvedValue(samplePlotFromDb);

      await expect(service.processPlot('plot-1234-uuid', {}, 'wrong-farm-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when plot has no subplots', async () => {
      mockPrisma.plot.findUnique.mockResolvedValue({
        ...samplePlotFromDb,
        subPlots: [],
      });

      await expect(service.processPlot('plot-1234-uuid')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when equationId is not found', async () => {
      mockPrisma.plot.findUnique.mockResolvedValue(samplePlotFromDb);
      mockPrisma.volumetricEquation.findUnique.mockResolvedValue(null);

      await expect(
        service.processPlot('plot-1234-uuid', { equationId: 'not-found-eq' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when no equation is provided and none is active', async () => {
      mockPrisma.plot.findUnique.mockResolvedValue(samplePlotFromDb);
      mockPrisma.volumetricEquation.findFirst.mockResolvedValue(null);

      await expect(service.processPlot('plot-1234-uuid')).rejects.toThrow(BadRequestException);
    });

    it('validates custom equation coefficients (Schumacher & Hall requires beta2)', async () => {
      mockPrisma.plot.findUnique.mockResolvedValue(samplePlotFromDb);

      const dto: ProcessInventoryDto = {
        equation: {
          modelType: EquationType.SCHUMACHER_HALL,
          beta0: -9.5,
          beta1: 1.8,
          beta2: null,
        },
      };

      await expect(service.processPlot('plot-1234-uuid', dto)).rejects.toThrow(BadRequestException);
    });

    it('validates custom equation coefficients (Husch cannot have beta2)', async () => {
      mockPrisma.plot.findUnique.mockResolvedValue(samplePlotFromDb);

      const dto: ProcessInventoryDto = {
        equation: {
          modelType: EquationType.HUSCH,
          beta0: -7.5,
          beta1: 2.1,
          beta2: 0.5,
        },
      };

      await expect(service.processPlot('plot-1234-uuid', dto)).rejects.toThrow(BadRequestException);
    });

    it('applies validation limits to trees and marks violators as invalid with warnings', async () => {
      const plotWithOutlierTrees = {
        ...samplePlotFromDb,
        subPlots: [
          {
            id: 'sp-1',
            name: 'Parcela 1',
            areaM2: 400,
            trees: [
              {
                id: 't-normal',
                name: 'Árvore Boa',
                diameterDapCm: 20,
                height: 15,
                quality: TreeQuality.NORMAL,
              },
              {
                id: 't-low-dap',
                name: 'Varejão',
                diameterDapCm: 3, // abaixo do min 5
                height: 6,
                quality: TreeQuality.DOMINADA,
              },
              {
                id: 't-high-dap',
                name: 'Gigante',
                diameterDapCm: 150, // acima do max 100
                height: 30,
                quality: TreeQuality.NORMAL,
              },
              {
                id: 't-no-height',
                name: 'Quebrada Sem Altura',
                diameterDapCm: 22,
                height: null, // sem altura
                quality: TreeQuality.QUEBRADA,
              },
            ],
          },
        ],
      };

      mockPrisma.plot.findUnique.mockResolvedValue(plotWithOutlierTrees);
      mockPrisma.volumetricEquation.findFirst.mockResolvedValue(sampleDbEquation);

      const result = await service.processPlot('plot-1234-uuid', {
        includeTreesInResult: true,
        validationLimits: {
          minDapCm: 5,
          maxDapCm: 100,
          minHeightM: 5,
          maxHeightM: 40,
        },
      });

      const trees = result.subPlots[0].trees!;
      expect(trees[0].isValid).toBe(true);
      expect(trees[0].volumeM3).toBeGreaterThan(0);
      expect(trees[0].basalAreaM2).toBeGreaterThan(0);

      // t-low-dap
      expect(trees[1].isValid).toBe(false);
      expect(trees[1].volumeM3).toBe(0);
      expect(trees[1].basalAreaM2).toBe(0);
      expect(trees[1].warnings).toContain('DAP abaixo do limite mínimo (5 cm)');

      // t-high-dap
      expect(trees[2].isValid).toBe(false);
      expect(trees[2].volumeM3).toBe(0);
      expect(trees[2].basalAreaM2).toBe(0);
      expect(trees[2].warnings).toContain('DAP acima do limite máximo (100 cm)');

      // t-no-height
      expect(trees[3].isValid).toBe(false);
      expect(trees[3].volumeM3).toBe(0);
      expect(trees[3].basalAreaM2).toBe(0);
      expect(trees[3].warnings).toContain(
        'Altura obrigatória para o modelo de equação selecionado',
      );

      expect(result.subPlots[0].totalBasalAreaM2).toBe(trees[0].basalAreaM2);
      expect(result.subPlots[0].validTreeCount).toBe(1);
      expect(result.totals.totalValidTreesMeasured).toBe(1);
    });

    it('falls back to defaultParcelaAreaM2 if subplot areaM2 is undefined', async () => {
      const plotWithNoSubPlotArea = {
        ...samplePlotFromDb,
        subPlots: [
          {
            id: 'sp-1',
            name: 'Parcela sem área',
            areaM2: null,
            trees: [
              {
                id: 't-1',
                name: 'T1',
                diameterDapCm: 20,
                height: 15,
                quality: TreeQuality.NORMAL,
              },
            ],
          },
        ],
      };

      mockPrisma.plot.findUnique.mockResolvedValue(plotWithNoSubPlotArea);
      mockPrisma.volumetricEquation.findFirst.mockResolvedValue(sampleDbEquation);

      const result = await service.processPlot('plot-1234-uuid', {
        defaultParcelaAreaM2: 500,
      });

      expect(result.subPlots[0].areaM2).toBe(500);
      // Fator de expansão 10000 / 500 = 20
      expect(result.subPlots[0].treesPerHa).toBe(20);
    });

    it('throws BadRequestException if subplot area is missing and defaultParcelaAreaM2 is not provided', async () => {
      const plotWithNoSubPlotArea = {
        ...samplePlotFromDb,
        subPlots: [
          {
            id: 'sp-1',
            name: 'Parcela sem área',
            areaM2: null,
            trees: [],
          },
        ],
      };

      mockPrisma.plot.findUnique.mockResolvedValue(plotWithNoSubPlotArea);
      mockPrisma.volumetricEquation.findFirst.mockResolvedValue(sampleDbEquation);

      await expect(service.processPlot('plot-1234-uuid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('processPayload', () => {
    it('successfully processes direct payload without database access', async () => {
      const payload: ProcessPayloadDto = {
        plotName: 'Simulação Florestal Rápida',
        plotAreaHa: 5.0,
        equation: {
          name: 'Spurr Simulado',
          modelType: EquationType.SPURR,
          beta0: 0.001,
          beta1: 0.00004,
        },
        defaultParcelaAreaM2: 400,
        includeTreesInResult: true,
        subPlots: [
          {
            name: 'Parcela S1',
            trees: [
              { diameterDapCm: 18, heightM: 14, quality: TreeQuality.NORMAL },
              { diameterDapCm: 24, heightM: 17, quality: TreeQuality.NORMAL },
            ],
          },
          {
            name: 'Parcela S2',
            trees: [
              { diameterDapCm: 22, heightM: 16, quality: TreeQuality.NORMAL },
              { diameterDapCm: 26, heightM: 19, quality: TreeQuality.NORMAL },
            ],
          },
        ],
      };

      const result = await service.processPayload(payload);

      expect(result.stage).toBe('COMPLETED');
      expect(result.context.plotName).toBe('Simulação Florestal Rápida');
      expect(result.context.plotAreaHa).toBe(5.0);
      expect(result.context.equationUsed.modelType).toBe(EquationType.SPURR);

      expect(result.totals.totalSubPlotsSampled).toBe(2);
      expect(result.totals.totalTreesMeasured).toBe(4);
      expect(result.totals.estimatedTotalVolumeM3).toBeGreaterThan(0);
      expect(result.subPlots[0].trees?.length).toBe(2);
      expect(result.statistics.volumePerHa.standardError).toBeGreaterThanOrEqual(0);
    });

    it('throws BadRequestException if payload subPlots array is empty', async () => {
      const payload: ProcessPayloadDto = {
        subPlots: [],
      };

      await expect(service.processPayload(payload)).rejects.toThrow(BadRequestException);
    });

    it('handles tree with dap <= 0 and height limit violations correctly', async () => {
      const payload: ProcessPayloadDto = {
        equation: {
          modelType: EquationType.HUSCH,
          beta0: -7,
          beta1: 2,
        },
        defaultParcelaAreaM2: 500,
        includeTreesInResult: true,
        validationLimits: {
          minHeightM: 10,
          maxHeightM: 30,
        },
        subPlots: [
          {
            name: 'Parcela Limites',
            trees: [
              { diameterDapCm: 0, heightM: 15 }, // dap <= 0
              { diameterDapCm: 20, heightM: 5 }, // height < minHeight (10)
              { diameterDapCm: 20, heightM: 35 }, // height > maxHeight (30)
            ],
          },
        ],
      };

      const result = await service.processPayload(payload);
      const trees = result.subPlots[0].trees!;

      expect(trees[0].isValid).toBe(false);
      expect(trees[0].warnings).toContain('DAP deve ser maior que zero');

      expect(trees[1].isValid).toBe(false);
      expect(trees[1].warnings).toContain('Altura abaixo do limite mínimo (10 m)');

      expect(trees[2].isValid).toBe(false);
      expect(trees[2].warnings).toContain('Altura acima do limite máximo (30 m)');
    });

    it('handles plot without farm and without plotAreaHa gracefully', async () => {
      mockPrisma.plot.findUnique.mockResolvedValue({
        id: 'plot-no-farm',
        name: 'Talhão Isolado',
        areaHa: 0,
        farmId: 'farm-none',
        farm: null,
        subPlots: [
          {
            id: 'sp-1',
            name: 'Parcela 1',
            areaM2: 400,
            trees: [{ diameterDapCm: 20, height: 15, quality: TreeQuality.NORMAL }],
          },
        ],
      });
      mockPrisma.volumetricEquation.findFirst.mockResolvedValue(sampleDbEquation);

      const result = await service.processPlot('plot-no-farm');
      expect(result.context.farmName).toBeUndefined();
      expect(result.totals.estimatedTotalVolumeM3).toBeNull();
    });

    it('marks tree with non-positive height as invalid with warning even in Husch model', async () => {
      const payload: ProcessPayloadDto = {
        equation: {
          modelType: EquationType.HUSCH,
          beta0: -7,
          beta1: 2,
        },
        defaultParcelaAreaM2: 500,
        includeTreesInResult: true,
        subPlots: [
          {
            name: 'Parcela Husch',
            trees: [
              { diameterDapCm: 20, heightM: -3 }, // altura negativa
              { diameterDapCm: 25, heightM: 0 }, // altura zero
            ],
          },
        ],
      };

      const result = await service.processPayload(payload);
      const trees = result.subPlots[0].trees!;

      expect(trees[0].isValid).toBe(false);
      expect(trees[0].warnings).toContain('Altura deve ser maior que zero');
      expect(trees[0].basalAreaM2).toBe(0);

      expect(trees[1].isValid).toBe(false);
      expect(trees[1].warnings).toContain('Altura deve ser maior que zero');
      expect(trees[1].basalAreaM2).toBe(0);
    });

    it('handles calculateVolume throwing exception or returning NaN gracefully', async () => {
      jest
        .spyOn(equationsService, 'calculateVolume')
        .mockImplementationOnce(() => {
          throw new Error('Falha no motor de cálculo');
        })
        .mockReturnValueOnce(NaN);

      const payload: ProcessPayloadDto = {
        equation: {
          modelType: EquationType.HUSCH,
          beta0: -7,
          beta1: 2,
        },
        defaultParcelaAreaM2: 500,
        includeTreesInResult: true,
        subPlots: [
          {
            name: 'Parcela Falhas',
            trees: [
              { diameterDapCm: 20, heightM: 15 },
              { diameterDapCm: 25, heightM: 18 },
            ],
          },
        ],
      };

      const result = await service.processPayload(payload);
      const trees = result.subPlots[0].trees!;

      expect(trees[0].isValid).toBe(false);
      expect(trees[0].volumeM3).toBe(0);
      expect(trees[0].warnings).toContain('Falha no motor de cálculo');

      expect(trees[1].isValid).toBe(false);
      expect(trees[1].volumeM3).toBe(0);
      expect(trees[1].warnings).toContain('Cálculo de volume resultou em valor inválido');
    });

    it('handles a subplot with zero trees without dividing by zero', async () => {
      const payload: ProcessPayloadDto = {
        equation: {
          modelType: EquationType.HUSCH,
          beta0: -7,
          beta1: 2,
        },
        defaultParcelaAreaM2: 400,
        subPlots: [
          {
            name: 'Parcela Vazia',
            trees: [],
          },
        ],
      };

      const result = await service.processPayload(payload);
      expect(result.totals.totalTreesMeasured).toBe(0);
      expect(result.totals.meanVolumePerHaM3).toBe(0);
      expect(result.totals.meanDapCm).toBe(0);
      expect(result.totals.quadraticMeanDapCm).toBe(0);
      expect(result.totals.meanHeightM).toBeNull();
      expect(result.statistics.volumePerHa.meetsErrorThreshold).toBe(false);
    });
  });
});
