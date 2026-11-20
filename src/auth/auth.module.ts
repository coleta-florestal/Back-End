import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';

import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

import { JwtStrategy } from './strategy/jwt.strategy';

import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './guard/jwt.guard';
import { RolesGuard } from './guard/roles.guard';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory(config: ConfigService) {
        return {
          secret: config.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '8h',
            algorithm: 'HS256',
          },
        };
      },
    }),
    EmailModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
