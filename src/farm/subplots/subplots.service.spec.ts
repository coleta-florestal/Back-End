import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from 'src/admin/audit/audit.service';
import type { User } from 'src/generated/prisma/client';
import {
  AccountStatus,
  AuditAction,
  AuditEntity,
  PlotStatus,
  Role,
  SubPlotStatus,
  UserStatus,
} from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlotsService } from '../plots/plots.service';
import { CreateSubPlotDto } from './dto/CreateSubPlot.dto';
import { SubPlotsService } from './subplots.service';

const makeActor = (): User => ({
  id: 'user-1',
  email: 'coletor@example.com',
  role: Role.USER,
  name: 'Coletor Teste',
  password: 'hashed-password',
  accountStatus: AccountStatus.ACTIVE,
  status: UserStatus.APPROVED,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
});

const makePlot = (status: PlotStatus) => ({
  id: 'plot-1',
  name: 'Talhão 01',
  areaHa: 12,
  description: null,
  status,
  farmId: 'farm-1',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
});

const makeCreateDto = (): CreateSubPlotDto => ({
  name: 'Parcela 01',
  areaM2: 400,
  targetTrees: 15,
});

describe('SubPlotsService', () => {
  let service: SubPlotsService;
  let subPlotCreate: jest.Mock;
  let subPlotFindFirst: jest.Mock;
  let subPlotUpdate: jest.Mock;
  let findPlot: jest.Mock;
  let auditCreate: jest.Mock;

  beforeEach(async () => {
    subPlotCreate = jest.fn();
    subPlotFindFirst = jest.fn();
    subPlotUpdate = jest.fn();
    findPlot = jest.fn();
    auditCreate = jest.fn().mockResolvedValue({ id: 'audit-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubPlotsService,
        {
          provide: PrismaService,
          useValue: {
            subPlot: {
              create: subPlotCreate,
              findFirst: subPlotFindFirst,
              update: subPlotUpdate,
            },
          },
        },
        {
          provide: PlotsService,
          useValue: {
            findPlot,
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

    service = module.get<SubPlotsService>(SubPlotsService);
  });

  describe('create', () => {
    it('deve bloquear o cadastro de nova parcela em um talhão finalizado (CT 19.5)', async () => {
      findPlot.mockResolvedValue(makePlot(PlotStatus.FINISHED));

      await expect(
        service.create(makeActor(), 'farm-1', 'plot-1', makeCreateDto()),
      ).rejects.toThrow(
        new ForbiddenException(
          'O talhão está finalizado e não permite o cadastro de novas parcelas.',
        ),
      );
      expect(subPlotCreate).not.toHaveBeenCalled();
      expect(auditCreate).not.toHaveBeenCalled();
    });

    it.each([PlotStatus.NOT_STARTED, PlotStatus.IN_PROGRESS])(
      'deve permitir o cadastro de parcela quando o talhão está com status %s',
      async (status) => {
        const actor = makeActor();
        const plot = makePlot(status);
        const dto = makeCreateDto();
        const createdSubPlot = {
          id: 'subplot-1',
          plotId: plot.id,
          name: dto.name,
          areaM2: dto.areaM2,
          targetTrees: dto.targetTrees,
          status: SubPlotStatus.OPEN,
        };

        findPlot.mockResolvedValue(plot);
        subPlotCreate.mockResolvedValue(createdSubPlot);

        const result = await service.create(actor, 'farm-1', 'plot-1', dto);

        expect(result).toEqual(createdSubPlot);
        expect(subPlotCreate).toHaveBeenCalledWith({
          data: {
            plotId: 'plot-1',
            name: dto.name,
            areaM2: dto.areaM2,
            targetTrees: dto.targetTrees,
          },
        });
        expect(auditCreate).toHaveBeenCalledWith(
          AuditAction.CREATE,
          AuditEntity.SUBPLOT,
          actor.id,
          {
            targetSubPlotId: createdSubPlot.id,
            subPlotName: createdSubPlot.name,
            plotId: plot.id,
            plotName: plot.name,
            farmId: 'farm-1',
          },
        );
      },
    );
  });

  describe('updateStatus', () => {
    it('deve bloquear a alteração de status de parcela em um talhão finalizado', async () => {
      const finishedPlot = makePlot(PlotStatus.FINISHED);
      findPlot.mockResolvedValue(finishedPlot);
      subPlotFindFirst.mockResolvedValue({
        id: 'subplot-1',
        name: 'Parcela 01',
        status: SubPlotStatus.COMPLETED,
        targetTrees: 10,
        _count: { trees: 10 },
        plot: finishedPlot,
        plotId: finishedPlot.id,
      });

      await expect(
        service.updateStatus(makeActor(), 'farm-1', 'plot-1', 'subplot-1', SubPlotStatus.OPEN),
      ).rejects.toThrow(
        new ForbiddenException(
          'Não é possível alterar o status de uma parcela em um talhão finalizado.',
        ),
      );
      expect(subPlotUpdate).not.toHaveBeenCalled();
      expect(auditCreate).not.toHaveBeenCalled();
    });

    it('deve permitir alterar o status da parcela quando o talhão não está finalizado', async () => {
      const actor = makeActor();
      const inProgressPlot = makePlot(PlotStatus.IN_PROGRESS);
      findPlot.mockResolvedValue(inProgressPlot);
      subPlotFindFirst.mockResolvedValue({
        id: 'subplot-1',
        name: 'Parcela 01',
        status: SubPlotStatus.OPEN,
        targetTrees: 10,
        _count: { trees: 10 },
        plot: inProgressPlot,
        plotId: inProgressPlot.id,
      });
      subPlotUpdate.mockResolvedValue({
        id: 'subplot-1',
        name: 'Parcela 01',
        status: SubPlotStatus.COMPLETED,
      });

      const result = await service.updateStatus(
        actor,
        'farm-1',
        'plot-1',
        'subplot-1',
        SubPlotStatus.COMPLETED,
      );

      expect(result.subPlot.status).toBe(SubPlotStatus.COMPLETED);
      expect(result.missingTrees).toBe(0);
      expect(result.warning).toBeNull();
      expect(subPlotUpdate).toHaveBeenCalledTimes(1);
      expect(auditCreate).toHaveBeenCalledWith(
        AuditAction.COMPLETE,
        AuditEntity.SUBPLOT,
        actor.id,
        {
          targetSubPlotId: 'subplot-1',
          subPlotName: 'Parcela 01',
          plotId: 'plot-1',
          plotName: inProgressPlot.name,
          previousStatus: SubPlotStatus.OPEN,
          newStatus: SubPlotStatus.COMPLETED,
          missingTrees: 0,
        },
      );
    });
  });
});
