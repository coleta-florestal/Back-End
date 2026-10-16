import { Module } from '@nestjs/common';
import { JwtModule } from "@nestjs/jwt"

import { AuthController } from './auth.controller';

import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject:[ConfigService],
      useFactory(config: ConfigService) {
        return {
          secret: config.get("JWT_SECRET"),
          signOptions: {
            expiresIn: "15m"
          }
        }
      }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
