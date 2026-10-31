import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { FarmModule } from './farm/farm.module';
import { ProfileModule } from './profile/profile.module';
import { AdminModule } from './admin/admin.module';
import { EquationsModule } from './equations/equations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    FarmModule,
    ProfileModule,
    AdminModule,
    EquationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
