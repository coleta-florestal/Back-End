import { Test } from '@nestjs/testing';
import { ProcessingModule } from './processing.module';
import { ProcessingService } from './processing.service';
import { StatisticsService } from './statistics.service';
import { ProcessingController } from './processing.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { EquationsService } from 'src/admin/equations/equations.service';

describe('ProcessingModule', () => {
  it('compiles the module and resolves its providers and controllers', async () => {
    const mockPrisma = {
      plot: { findUnique: jest.fn() },
      volumetricEquation: { findUnique: jest.fn(), findFirst: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      imports: [ProcessingModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    expect(moduleRef).toBeDefined();
    expect(moduleRef.get(ProcessingController)).toBeInstanceOf(ProcessingController);
    expect(moduleRef.get(ProcessingService)).toBeInstanceOf(ProcessingService);
    expect(moduleRef.get(StatisticsService)).toBeInstanceOf(StatisticsService);
    expect(moduleRef.get(EquationsService)).toBeInstanceOf(EquationsService);
  });
});
