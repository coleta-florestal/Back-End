import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from 'src/admin/audit/audit.service';
import { ValidationsService } from 'src/admin/validations/validations.service';
import type { User } from 'src/generated/prisma/client';
import {
  AccountStatus,
  AuditAction,
  AuditEntity,
  PlotStatus,
  Role,
  SubPlotStatus,
  TreeQuality,
  UserStatus,
} from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

import { SubPlotsService } from '../subplots/subplots.service';
import { CreateTreeDto } from './dto/CreateTree.dto';
import { UpdateTreeDto } from './dto/UpdateTree.dto';
import { TreesService } from './trees.service';

describe('TreesService', () => {
  let service: TreesService;
  let findUniqueSettingsMock: jest.Mock;
  let treeFindFirstMock: jest.Mock;
  let treeCreateMock: jest.Mock;
  let treeUpdateMock: jest.Mock;
  let treeDeleteMock: jest.Mock;
  let findSubPlotMock: jest.Mock;
  let auditCreateMock: jest.Mock;

  const farmId = 'farm-1';
  const plotId = 'plot-1';
  const subPlotId = 'subplot-1';
  const treeId = 'tree-1';

  const actor: User = {
    id: 'user-1',
    email: 'coletor@example.com',
    role: Role.USER,
    name: 'Coletor Teste',
    password: 'hashed-password',
    accountStatus: AccountStatus.ACTIVE,
    status: UserStatus.APPROVED,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const defaultSettings = {
    id: 1,
    minDapCm: 5,
    maxDapCm: 100,
    minHeightM: 2,
    maxHeightM: 50,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const buildSubPlot = (
    subPlotStatus: SubPlotStatus = SubPlotStatus.OPEN,
    plotStatus: PlotStatus = PlotStatus.IN_PROGRESS,
  ) => ({
    id: subPlotId,
    name: 'Parcela 01',
    status: subPlotStatus,
    plotId,
    plot: {
      id: plotId,
      name: 'Talhão 01',
      status: plotStatus,
      farmId,
    },
  });

  const baseCreateDto: CreateTreeDto = {
    name: 'Árvore 01',
    diameterDapCm: 25,
    height: 15,
    quality: TreeQuality.NORMAL,
    observations: 'Sem observações',
  };

  const expectPlainForbidden = async (promise: Promise<unknown>, expectedMessage: string) => {
    try {
      await promise;
      fail('Era esperado lançar ForbiddenException.');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      const response = (error as ForbiddenException).getResponse() as Record<string, unknown>;
      expect(response.message).toBe(expectedMessage);
      expect(response.msg).toBeUndefined();
    }
  };

  beforeEach(async () => {
    findUniqueSettingsMock = jest.fn().mockResolvedValue(defaultSettings);
    treeFindFirstMock = jest.fn();
    treeCreateMock = jest.fn();
    treeUpdateMock = jest.fn();
    treeDeleteMock = jest.fn();
    findSubPlotMock = jest.fn();
    auditCreateMock = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreesService,
        ValidationsService,
        {
          provide: PrismaService,
          useValue: {
            validationSettings: {
              findUnique: findUniqueSettingsMock,
            },
            tree: {
              findFirst: treeFindFirstMock,
              create: treeCreateMock,
              update: treeUpdateMock,
              delete: treeDeleteMock,
            },
          },
        },
        {
          provide: SubPlotsService,
          useValue: {
            findSubPlot: findSubPlotMock,
          },
        },
        {
          provide: AuditService,
          useValue: {
            create: auditCreateMock,
          },
        },
      ],
    }).compile();

    service = module.get<TreesService>(TreesService);
  });

  describe('create', () => {
    it('deve criar árvore quando DAP e altura estão dentro dos limites configurados', async () => {
      const subPlot = buildSubPlot();
      const createdTree = { id: treeId, subPlotId, ...baseCreateDto };

      findSubPlotMock.mockResolvedValue(subPlot);
      treeCreateMock.mockResolvedValue(createdTree);

      const result = await service.create(actor, farmId, plotId, subPlotId, baseCreateDto);

      expect(result).toEqual(createdTree);
      expect(findUniqueSettingsMock).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(treeCreateMock).toHaveBeenCalledTimes(1);
      expect(auditCreateMock).toHaveBeenCalledWith(AuditAction.CREATE, AuditEntity.TREE, actor.id, {
        farmId,
        plotId,
        plotName: subPlot.plot.name,
        subPlotId,
        subPlotName: subPlot.name,
      });
    });

    it('deve aceitar valores exatos nos limites mínimo e máximo configurados', async () => {
      findSubPlotMock.mockResolvedValue(buildSubPlot());
      treeCreateMock.mockResolvedValue({ id: treeId });

      await expect(
        service.create(actor, farmId, plotId, subPlotId, {
          ...baseCreateDto,
          diameterDapCm: defaultSettings.minDapCm,
          height: defaultSettings.maxHeightM,
        }),
      ).resolves.toEqual({ id: treeId });

      await expect(
        service.create(actor, farmId, plotId, subPlotId, {
          ...baseCreateDto,
          diameterDapCm: defaultSettings.maxDapCm,
          height: defaultSettings.minHeightM,
        }),
      ).resolves.toEqual({ id: treeId });
    });

    it('deve rejeitar DAP 9999 acima do máximo configurado com BadRequestException', async () => {
      findSubPlotMock.mockResolvedValue(buildSubPlot());

      await expect(
        service.create(actor, farmId, plotId, subPlotId, {
          ...baseCreateDto,
          diameterDapCm: 9999,
        }),
      ).rejects.toThrow(
        new BadRequestException(
          `DAP deve estar entre ${defaultSettings.minDapCm} cm e ${defaultSettings.maxDapCm} cm.`,
        ),
      );

      expect(treeCreateMock).not.toHaveBeenCalled();
    });

    it('deve rejeitar DAP abaixo do mínimo configurado com BadRequestException', async () => {
      findSubPlotMock.mockResolvedValue(buildSubPlot());

      await expect(
        service.create(actor, farmId, plotId, subPlotId, {
          ...baseCreateDto,
          diameterDapCm: 4.9,
        }),
      ).rejects.toThrow(
        new BadRequestException(
          `DAP deve estar entre ${defaultSettings.minDapCm} cm e ${defaultSettings.maxDapCm} cm.`,
        ),
      );

      expect(treeCreateMock).not.toHaveBeenCalled();
    });

    it('deve rejeitar altura acima do máximo configurado com BadRequestException', async () => {
      findSubPlotMock.mockResolvedValue(buildSubPlot());

      await expect(
        service.create(actor, farmId, plotId, subPlotId, {
          ...baseCreateDto,
          height: 50.1,
        }),
      ).rejects.toThrow(
        new BadRequestException(
          `Altura deve estar entre ${defaultSettings.minHeightM} m e ${defaultSettings.maxHeightM} m.`,
        ),
      );

      expect(treeCreateMock).not.toHaveBeenCalled();
    });

    it('deve rejeitar altura abaixo do mínimo configurado com BadRequestException', async () => {
      findSubPlotMock.mockResolvedValue(buildSubPlot());

      await expect(
        service.create(actor, farmId, plotId, subPlotId, {
          ...baseCreateDto,
          height: 1.5,
        }),
      ).rejects.toThrow(
        new BadRequestException(
          `Altura deve estar entre ${defaultSettings.minHeightM} m e ${defaultSettings.maxHeightM} m.`,
        ),
      );

      expect(treeCreateMock).not.toHaveBeenCalled();
    });

    it('deve permitir criar árvore quando ValidationSettings (id: 1) for null', async () => {
      findSubPlotMock.mockResolvedValue(buildSubPlot());
      findUniqueSettingsMock.mockResolvedValue(null);
      treeCreateMock.mockResolvedValue({ id: treeId, diameterDapCm: 9999, height: 500 });

      const result = await service.create(actor, farmId, plotId, subPlotId, {
        ...baseCreateDto,
        diameterDapCm: 9999,
        height: 500,
      });

      expect(result).toEqual({ id: treeId, diameterDapCm: 9999, height: 500 });
      expect(treeCreateMock).toHaveBeenCalledTimes(1);
    });

    it('deve rejeitar criação quando a parcela está COMPLETED com ForbiddenException', async () => {
      findSubPlotMock.mockResolvedValue(
        buildSubPlot(SubPlotStatus.COMPLETED, PlotStatus.IN_PROGRESS),
      );

      await expectPlainForbidden(
        service.create(actor, farmId, plotId, subPlotId, baseCreateDto),
        'A parcela foi concluída, você não pode adicionar mais árvores.',
      );

      expect(findUniqueSettingsMock).not.toHaveBeenCalled();
      expect(treeCreateMock).not.toHaveBeenCalled();
    });

    it('deve rejeitar criação quando o talhão está FINISHED com ForbiddenException', async () => {
      findSubPlotMock.mockResolvedValue(buildSubPlot(SubPlotStatus.COMPLETED, PlotStatus.FINISHED));

      await expectPlainForbidden(
        service.create(actor, farmId, plotId, subPlotId, baseCreateDto),
        'O talhão foi finalizado, você não pode adicionar mais árvores.',
      );

      expect(findUniqueSettingsMock).not.toHaveBeenCalled();
      expect(treeCreateMock).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const validUpdateDto: UpdateTreeDto = {
      diameterDapCm: 30,
      height: 20,
    };

    it('deve atualizar árvore quando DAP e altura estão dentro dos limites configurados', async () => {
      const subPlot = buildSubPlot();
      const updatedTree = { id: treeId, ...validUpdateDto };

      findSubPlotMock.mockResolvedValue(subPlot);
      treeFindFirstMock.mockResolvedValue({ subPlot });
      treeUpdateMock.mockResolvedValue(updatedTree);

      const result = await service.update(actor, farmId, plotId, subPlotId, treeId, validUpdateDto);

      expect(result).toEqual(updatedTree);
      expect(findUniqueSettingsMock).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(treeUpdateMock).toHaveBeenCalledTimes(1);
      expect(auditCreateMock).toHaveBeenCalledWith(AuditAction.UPDATE, AuditEntity.TREE, actor.id, {
        farmId,
        plotId,
        plotName: subPlot.plot.name,
        subPlotId,
        subPlotName: subPlot.name,
      });
    });

    it('deve atualizar árvore parcialmente sem DAP e altura definidos', async () => {
      const subPlot = buildSubPlot();
      const partialDto: UpdateTreeDto = { name: 'Árvore Renomeada' };

      findSubPlotMock.mockResolvedValue(subPlot);
      treeFindFirstMock.mockResolvedValue({ subPlot });
      treeUpdateMock.mockResolvedValue({ id: treeId, name: 'Árvore Renomeada' });

      const result = await service.update(actor, farmId, plotId, subPlotId, treeId, partialDto);

      expect(result).toEqual({ id: treeId, name: 'Árvore Renomeada' });
      expect(treeUpdateMock).toHaveBeenCalledTimes(1);
    });

    it('deve rejeitar atualização com DAP 9999 acima do máximo configurado', async () => {
      const subPlot = buildSubPlot();

      findSubPlotMock.mockResolvedValue(subPlot);
      treeFindFirstMock.mockResolvedValue({ subPlot });

      await expect(
        service.update(actor, farmId, plotId, subPlotId, treeId, { diameterDapCm: 9999 }),
      ).rejects.toThrow(
        new BadRequestException(
          `DAP deve estar entre ${defaultSettings.minDapCm} cm e ${defaultSettings.maxDapCm} cm.`,
        ),
      );

      expect(treeUpdateMock).not.toHaveBeenCalled();
    });

    it('deve rejeitar atualização com DAP abaixo do mínimo configurado', async () => {
      const subPlot = buildSubPlot();

      findSubPlotMock.mockResolvedValue(subPlot);
      treeFindFirstMock.mockResolvedValue({ subPlot });

      await expect(
        service.update(actor, farmId, plotId, subPlotId, treeId, { diameterDapCm: 2 }),
      ).rejects.toThrow(
        new BadRequestException(
          `DAP deve estar entre ${defaultSettings.minDapCm} cm e ${defaultSettings.maxDapCm} cm.`,
        ),
      );

      expect(treeUpdateMock).not.toHaveBeenCalled();
    });

    it('deve rejeitar atualização com altura acima do máximo configurado', async () => {
      const subPlot = buildSubPlot();

      findSubPlotMock.mockResolvedValue(subPlot);
      treeFindFirstMock.mockResolvedValue({ subPlot });

      await expect(
        service.update(actor, farmId, plotId, subPlotId, treeId, { height: 75 }),
      ).rejects.toThrow(
        new BadRequestException(
          `Altura deve estar entre ${defaultSettings.minHeightM} m e ${defaultSettings.maxHeightM} m.`,
        ),
      );

      expect(treeUpdateMock).not.toHaveBeenCalled();
    });

    it('deve rejeitar atualização com altura abaixo do mínimo configurado', async () => {
      const subPlot = buildSubPlot();

      findSubPlotMock.mockResolvedValue(subPlot);
      treeFindFirstMock.mockResolvedValue({ subPlot });

      await expect(
        service.update(actor, farmId, plotId, subPlotId, treeId, { height: 0.5 }),
      ).rejects.toThrow(
        new BadRequestException(
          `Altura deve estar entre ${defaultSettings.minHeightM} m e ${defaultSettings.maxHeightM} m.`,
        ),
      );

      expect(treeUpdateMock).not.toHaveBeenCalled();
    });

    it('deve permitir atualizar árvore quando ValidationSettings (id: 1) for null', async () => {
      const subPlot = buildSubPlot();

      findSubPlotMock.mockResolvedValue(subPlot);
      treeFindFirstMock.mockResolvedValue({ subPlot });
      findUniqueSettingsMock.mockResolvedValue(null);
      treeUpdateMock.mockResolvedValue({ id: treeId, diameterDapCm: 9999 });

      const result = await service.update(actor, farmId, plotId, subPlotId, treeId, {
        diameterDapCm: 9999,
      });

      expect(result).toEqual({ id: treeId, diameterDapCm: 9999 });
      expect(treeUpdateMock).toHaveBeenCalledTimes(1);
    });

    it('deve rejeitar atualização quando a parcela está COMPLETED com ForbiddenException', async () => {
      const subPlot = buildSubPlot(SubPlotStatus.COMPLETED, PlotStatus.IN_PROGRESS);

      findSubPlotMock.mockResolvedValue(subPlot);
      treeFindFirstMock.mockResolvedValue({ subPlot });

      await expectPlainForbidden(
        service.update(actor, farmId, plotId, subPlotId, treeId, validUpdateDto),
        'A parcela foi concluída, você não pode mais editar as árvores.',
      );

      expect(findUniqueSettingsMock).not.toHaveBeenCalled();
      expect(treeUpdateMock).not.toHaveBeenCalled();
    });

    it('deve rejeitar atualização quando o talhão está FINISHED com ForbiddenException', async () => {
      const subPlot = buildSubPlot(SubPlotStatus.COMPLETED, PlotStatus.FINISHED);

      findSubPlotMock.mockResolvedValue(subPlot);
      treeFindFirstMock.mockResolvedValue({ subPlot });

      await expectPlainForbidden(
        service.update(actor, farmId, plotId, subPlotId, treeId, validUpdateDto),
        'O talhão foi finalizado, você não pode mais editar as árvores.',
      );

      expect(findUniqueSettingsMock).not.toHaveBeenCalled();
      expect(treeUpdateMock).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve remover árvore quando talhão não está finalizado e parcela está aberta', async () => {
      const subPlot = buildSubPlot();

      findSubPlotMock.mockResolvedValue(subPlot);
      treeFindFirstMock.mockResolvedValue({ subPlot });
      treeDeleteMock.mockResolvedValue({ id: treeId });

      await service.remove(actor, farmId, plotId, subPlotId, treeId);

      expect(treeDeleteMock).toHaveBeenCalledTimes(1);
      expect(auditCreateMock).toHaveBeenCalledWith(AuditAction.DELETE, AuditEntity.TREE, actor.id, {
        farmId,
        plotId,
        plotName: subPlot.plot.name,
        subPlotId,
        subPlotName: subPlot.name,
      });
    });

    it('deve rejeitar remoção quando a parcela está COMPLETED com ForbiddenException', async () => {
      const subPlot = buildSubPlot(SubPlotStatus.COMPLETED, PlotStatus.IN_PROGRESS);

      findSubPlotMock.mockResolvedValue(subPlot);
      treeFindFirstMock.mockResolvedValue({ subPlot });

      await expectPlainForbidden(
        service.remove(actor, farmId, plotId, subPlotId, treeId),
        'A parcela foi concluída, você não pode mais deletar árvores.',
      );

      expect(treeDeleteMock).not.toHaveBeenCalled();
    });

    it('deve rejeitar remoção quando o talhão está FINISHED com ForbiddenException', async () => {
      const subPlot = buildSubPlot(SubPlotStatus.COMPLETED, PlotStatus.FINISHED);

      findSubPlotMock.mockResolvedValue(subPlot);
      treeFindFirstMock.mockResolvedValue({ subPlot });

      await expectPlainForbidden(
        service.remove(actor, farmId, plotId, subPlotId, treeId),
        'O talhão foi finalizado, você não pode mais deletar árvores.',
      );

      expect(treeDeleteMock).not.toHaveBeenCalled();
    });
  });
});
