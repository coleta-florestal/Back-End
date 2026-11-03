import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AuthModule } from 'src/auth/auth.module';
import { Role } from 'src/generated/prisma/enums';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateValidationSettingsDto } from './dto/update-validation-settings.dto';
import { ValidationsModule } from './validations.module';

describe('Validation settings HTTP', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let saved: ({ id: number } & UpdateValidationSettingsDto) | null;
  const limits = { minDapCm: 1, maxDapCm: 200, minHeightM: 0.5, maxHeightM: 80 };
  const rolesByEmail: Record<string, Role> = {
    'admin@example.test': Role.ADMIN,
    'super_admin@example.test': Role.SUPER_ADMIN,
    'user@example.test': Role.USER,
  };
  const prisma = {
    user: { findUnique: jest.fn() },
    validationSettings: { findUnique: jest.fn(), upsert: jest.fn() },
  };

  function token(role: Role) {
    return jwt.sign({ sub: role, email: `${role.toLowerCase()}@example.test`, role });
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET: 'validation-settings-test-secret' })],
        }),
        PrismaModule,
        AuthModule,
        ValidationsModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    jwt = module.get(JwtService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    saved = null;
    prisma.user.findUnique.mockImplementation(({ where }: { where: { email: string } }) => {
      const role = rolesByEmail[where.email];
      return Promise.resolve(role ? { id: role, email: where.email, role } : null);
    });
    prisma.validationSettings.findUnique.mockImplementation(() => Promise.resolve(saved));
    prisma.validationSettings.upsert.mockImplementation(
      ({
        create,
        update,
      }: {
        create: { id: number } & UpdateValidationSettingsDto;
        update: UpdateValidationSettingsDto;
      }) => {
        saved = saved ? { ...saved, ...update } : create;
        return Promise.resolve(saved);
      },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([Role.ADMIN, Role.SUPER_ADMIN])(
    'allows %s to create, read and replace limits',
    async (role) => {
      const authorization = `Bearer ${token(role)}`;
      const server = app.getHttpServer();

      await request(server)
        .get('/admin/validations')
        .set('Authorization', authorization)
        .expect(404);
      await request(server)
        .put('/admin/validations')
        .set('Authorization', authorization)
        .send(limits)
        .expect(200)
        .expect({ id: 1, ...limits });

      const updated = { ...limits, maxDapCm: 180, maxHeightM: 70 };
      await request(server)
        .put('/admin/validations')
        .set('Authorization', authorization)
        .send(updated)
        .expect(200)
        .expect({ id: 1, ...updated });
      await request(server)
        .get('/admin/validations')
        .set('Authorization', authorization)
        .expect(200)
        .expect({ id: 1, ...updated });
    },
  );

  it.each(['get', 'put'] as const)('rejects unauthenticated %s requests', async (method) => {
    await request(app.getHttpServer())[method]('/admin/validations').send(limits).expect(401);
    expect(prisma.validationSettings.upsert).not.toHaveBeenCalled();
  });

  it.each(['get', 'put'] as const)('rejects USER access to %s', async (method) => {
    await request(app.getHttpServer())
      [method]('/admin/validations')
      .set('Authorization', `Bearer ${token(Role.USER)}`)
      .send(limits)
      .expect(403);
    expect(prisma.validationSettings.findUnique).not.toHaveBeenCalled();
    expect(prisma.validationSettings.upsert).not.toHaveBeenCalled();
  });

  it('rejects an invalid token', async () => {
    await request(app.getHttpServer())
      .get('/admin/validations')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('uses the database role instead of trusting the token role', async () => {
    const forgedRole = jwt.sign({ sub: 'user', email: 'user@example.test', role: Role.ADMIN });
    await request(app.getHttpServer())
      .put('/admin/validations')
      .set('Authorization', `Bearer ${forgedRole}`)
      .send(limits)
      .expect(403);
  });

  it.each([
    {},
    { ...limits, minDapCm: 0 },
    { ...limits, maxHeightM: -1 },
    { ...limits, minHeightM: '1' },
    { ...limits, maxDapCm: null },
    { ...limits, minDapCm: limits.maxDapCm },
    { ...limits, minHeightM: limits.maxHeightM + 1 },
    { ...limits, projectId: 'unexpected-field' },
  ])('rejects invalid settings without saving: %j', async (body) => {
    await request(app.getHttpServer())
      .put('/admin/validations')
      .set('Authorization', `Bearer ${token(Role.ADMIN)}`)
      .send(body)
      .expect(400);
    expect(prisma.validationSettings.upsert).not.toHaveBeenCalled();
  });
});
