import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { ValidationsService } from './validations.service';

describe('ValidationsService', () => {
  let service: ValidationsService;
  const prisma = {
    validationSettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };
  const limits = { minDapCm: 1, maxDapCm: 200, minHeightM: 0.5, maxHeightM: 80 };
  const settings = { id: 1, ...limits };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [ValidationsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ValidationsService);
  });

  it('returns the configured limits', async () => {
    prisma.validationSettings.findUnique.mockResolvedValue(settings);

    await expect(service.findOne()).resolves.toEqual(settings);
  });

  it('requires an administrator to configure limits before they can be read', async () => {
    prisma.validationSettings.findUnique.mockResolvedValue(null);

    await expect(service.findOne()).rejects.toThrow(NotFoundException);
  });

  it('saves the limits in the shared configuration', async () => {
    prisma.validationSettings.upsert.mockResolvedValue(settings);

    await expect(service.update(limits)).resolves.toEqual(settings);
    expect(prisma.validationSettings.upsert).toHaveBeenCalledWith({
      where: { id: 1 },
      create: { id: 1, ...limits },
      update: limits,
    });
  });

  it.each([{ minDapCm: 201 }, { minDapCm: 200 }, { minHeightM: 81 }, { minHeightM: 80 }])(
    'rejects inverted or equal limits without saving: %j',
    async (changes) => {
      await expect(service.update({ ...limits, ...changes })).rejects.toThrow(BadRequestException);
      expect(prisma.validationSettings.upsert).not.toHaveBeenCalled();
    },
  );
});
