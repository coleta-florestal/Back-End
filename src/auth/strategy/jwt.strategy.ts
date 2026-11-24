import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PayloadDto } from '../dto/Payload.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: PayloadDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      omit: {
        password: true,
      },
    });
    if (!user || user.status !== 'APPROVED' || user.accountStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário inativo ou não autorizado');
    }
    return user;
  }
}
