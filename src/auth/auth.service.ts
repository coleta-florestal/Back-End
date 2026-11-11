import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

import * as b from 'bcrypt';

import { SignUpDto } from './dto/SignUp.dto';
import { SignInDto } from './dto/SignIn.dto';
import { PayloadDto } from './dto/Payload.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: SignUpDto) {
    try {
      const hashedPassword = await b.hash(dto.password, 8);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.userName,
          password: hashedPassword,
        },
      });

      return this.signToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException({
            message: 'Esse email já está sendo usado',
          });
        }
      }
      throw error;
    }
  }

  async singin(dto: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        message: 'Credenciais inválidas',
      });
    }

    const passwordMatches = await b.compare(dto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException({
        message: 'Credenciais inválidas',
      });
    }

    return this.signToken({ sub: user.id, email: user.email, role: user.role });
  }

  private signToken({ sub, email, role }: PayloadDto) {
    const payload = {
      sub: sub,
      email: email,
      role: role,
    };

    const token = this.jwt.sign(payload);

    return {
      access_token: token,
    };
  }
}
