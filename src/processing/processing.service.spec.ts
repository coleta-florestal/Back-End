import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from 'src/admin/audit/audit.service';
import { EquationsService } from 'src/admin/equations/equations.service';
import type { User } from 'src/generated/prisma/client';
import {
  AccountStatus,
  AuditAction,
  AuditEntity,
  EquationType,
  PlotStatus,
  Role,
  SubPlotStatus,
  TreeQuality,
  UserStatus,
} from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProcessingService } from './processing.service';
import { StatisticsService } from './statistics.service';

const makeActor = (): User => ({
  id: 'user-admin-1',
  email: 'admin@example.com',
  role: Role.ADMIN,
  name: 'Admin Teste',
  password: 'hashed-password',
  accountStatus: AccountStatus.ACTIVE,
  status: UserStatus.APPROVED,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
});

const makeSubPlot = (id: string, name: string, status: SubPlotStatus) => ({
  id,
  name,
  areaM2: 400,
  targetTrees: 10,
  status,
  plotId: 'plot-1',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  trees: [
    {
      id: `tree-${id}-1`,
      name: 'Árvore 1',
      diameterDapCm: 20,
      height: 18,
      quality: TreeQuality.NORMAL,
      observations: null,
      subPlotId: id,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    },
  ],
});

const makePlot = (status: PlotStatus, subPlots: ReturnType<typeof makeSubPlot>[]) => ({
  id: 'plot-1',
  name: 'Talhão 01',
  areaHa: 10,
  description: null,
  status,
  farmId: 'farm-1',
  farm: { name: 'Fazenda Modelo' },
  subPlots,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
});

const activeEquation = {
  id: 'eq-1',
  name: 'Schumacher & Hall Padrão',
  modelType: EquationType.SCHUMACHER_HALL,
  beta0: -9.5,
  beta1: 1.8,
  beta2: 1.0,
  r2: 0.98,
  syx: 0.05,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('ProcessingService', () => {
  let service: ProcessingService;
  let plotFindUnique: jest.Mock;
  let plotUpdate: jest.Mock;
  let volumetricEquationFindFirst: jest.Mock;
  let volumetricEquationFindUnique: jest.Mock;
  let auditCreate: jest.Mock;

  beforeEach(async () => {
    plotFindUnique = jest.fn();
    plotUpdate = jest.fn();
    volumetricEquationFindFirst = jest.fn().mockResolvedValue(activeEquation);
    volumetricEquationFindUnique = jest.fn().mockResolvedValue(activeEquation);
    auditCreate = jest.fn().mockResolvedValue({ id: 'audit-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessingService,
        EquationsService,
        StatisticsService,
        {
          provide: PrismaService,
          useValue: {
            plot: {
              findUnique: plotFindUnique,
              update: plotUpdate,
            },
            volumetricEquation: {
              findFirst: volumetricEquationFindFirst,
              findUnique: volumetricEquationFindUnique,
            },
          },
        },
        {
          provide: AuditService,
          useValue: {
            create: auditCreate,
          },
        },
      ],
    }).compile();

    service = module.get<ProcessingService>(ProcessingService);
  });

  it('deve rejeitar processamento quando o talhão não possui parcelas cadastradas', async () => {
    plotFindUnique.mockResolvedValue(makePlot(PlotStatus.NOT_STARTED, []));

    await expect(service.processPlot('plot-1')).rejects.toThrow(
      new BadRequestException('O talhão não possui parcelas cadastradas para processamento.'),
    );
    expect(plotUpdate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it('deve rejeitar processamento quando houver parcelas em aberto listando seus nomes (CT 19.3)', async () => {
    plotFindUnique.mockResolvedValue(
      makePlot(PlotStatus.IN_PROGRESS, [
        makeSubPlot('sp-1', 'Parcela 01', SubPlotStatus.COMPLETED),
        makeSubPlot('sp-2', 'Parcela 02', SubPlotStatus.COMPLETED),
        makeSubPlot('sp-3', 'Parcela 03', SubPlotStatus.OPEN),
        makeSubPlot('sp-4', 'Parcela 04', SubPlotStatus.OPEN),
      ]),
    );

    await expect(
      service.processPlot('plot-1', {}, 'farm-1', { actor: makeActor() }),
    ).rejects.toThrow(
      new BadRequestException(
        'Encerre todas as parcelas antes de finalizar a amostra. Parcelas pendentes: Parcela 03, Parcela 04.',
      ),
    );
    expect(plotUpdate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it('deve rejeitar processamento quando houver apenas 1 parcela concluída (UC26 - CT04)', async () => {
    plotFindUnique.mockResolvedValue(
      makePlot(PlotStatus.IN_PROGRESS, [
        makeSubPlot('sp-1', 'Parcela 01', SubPlotStatus.COMPLETED),
      ]),
    );

    await expect(
      service.processPlot('plot-1', {}, 'farm-1', { actor: makeActor() }),
    ).rejects.toThrow(
      new BadRequestException(
        'São necessárias pelo menos 2 parcelas concluídas para processar o inventário.',
      ),
    );
    expect(plotUpdate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it('deve processar com 2 ou mais parcelas concluídas, finalizar o talhão e registrar auditoria', async () => {
    const actor = makeActor();
    plotFindUnique.mockResolvedValue(
      makePlot(PlotStatus.IN_PROGRESS, [
        makeSubPlot('sp-1', 'Parcela 01', SubPlotStatus.COMPLETED),
        makeSubPlot('sp-2', 'Parcela 02', SubPlotStatus.COMPLETED),
      ]),
    );
    plotUpdate.mockResolvedValue({ id: 'plot-1', status: PlotStatus.FINISHED });

    const result = await service.processPlot('plot-1', {}, 'farm-1', { actor });

    expect(result.stage).toBe('COMPLETED');
    expect(result.totals.totalSubPlotsSampled).toBe(2);
    expect(plotUpdate).toHaveBeenCalledTimes(1);
    expect(plotUpdate).toHaveBeenCalledWith({
      where: { id: 'plot-1' },
      data: { status: PlotStatus.FINISHED },
    });
    expect(auditCreate).toHaveBeenCalledTimes(1);
    expect(auditCreate).toHaveBeenCalledWith(AuditAction.COMPLETE, AuditEntity.PLOT, actor.id, {
      targetPlotId: 'plot-1',
      plotName: 'Talhão 01',
      farmId: 'farm-1',
      previousStatus: PlotStatus.IN_PROGRESS,
      newStatus: PlotStatus.FINISHED,
    });
  });

  it('deve finalizar o talhão sem registrar auditoria quando actor não for informado', async () => {
    plotFindUnique.mockResolvedValue(
      makePlot(PlotStatus.IN_PROGRESS, [
        makeSubPlot('sp-1', 'Parcela 01', SubPlotStatus.COMPLETED),
        makeSubPlot('sp-2', 'Parcela 02', SubPlotStatus.COMPLETED),
      ]),
    );
    plotUpdate.mockResolvedValue({ id: 'plot-1', status: PlotStatus.FINISHED });

    const result = await service.processPlot('plot-1', {}, 'farm-1');

    expect(result.stage).toBe('COMPLETED');
    expect(plotUpdate).toHaveBeenCalledTimes(1);
    expect(plotUpdate).toHaveBeenCalledWith({
      where: { id: 'plot-1' },
      data: { status: PlotStatus.FINISHED },
    });
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it('deve permitir reprocessar talhão já finalizado sem atualizar status nem duplicar auditoria (UC28 - CT05)', async () => {
    const actor = makeActor();
    plotFindUnique.mockResolvedValue(
      makePlot(PlotStatus.FINISHED, [
        makeSubPlot('sp-1', 'Parcela 01', SubPlotStatus.COMPLETED),
        makeSubPlot('sp-2', 'Parcela 02', SubPlotStatus.COMPLETED),
      ]),
    );

    const result = await service.processPlot(
      'plot-1',
      {
        equation: {
          name: 'Husch Reprocessada',
          modelType: EquationType.HUSCH,
          beta0: -9,
          beta1: 2.3,
        },
      },
      'farm-1',
      { actor },
    );

    expect(result.stage).toBe('COMPLETED');
    expect(result.context.equationUsed.name).toBe('Husch Reprocessada');
    expect(plotUpdate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it('deve permitir pré-visualização no modo Dashboard com 1 parcela concluída sem finalizar o talhão', async () => {
    plotFindUnique.mockResolvedValue(
      makePlot(PlotStatus.IN_PROGRESS, [
        makeSubPlot('sp-1', 'Parcela 01', SubPlotStatus.COMPLETED),
        makeSubPlot('sp-2', 'Parcela 02', SubPlotStatus.OPEN),
      ]),
    );

    const result = await service.processPlot('plot-1', { equationId: 'eq-1' }, 'farm-1', {
      finalizePlot: false,
      enforceCompletionRules: false,
    });

    expect(result.stage).toBe('COMPLETED');
    expect(result.totals.totalSubPlotsSampled).toBe(1);
    expect(plotUpdate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it('deve rejeitar no modo Dashboard quando nenhuma parcela estiver concluída', async () => {
    plotFindUnique.mockResolvedValue(
      makePlot(PlotStatus.IN_PROGRESS, [makeSubPlot('sp-1', 'Parcela 01', SubPlotStatus.OPEN)]),
    );

    await expect(
      service.processPlot('plot-1', { equationId: 'eq-1' }, 'farm-1', {
        finalizePlot: false,
        enforceCompletionRules: false,
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'O talhão não possui parcelas concluídas. Conclua ao menos uma parcela para processar o inventário.',
      ),
    );
    expect(plotUpdate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });
});
