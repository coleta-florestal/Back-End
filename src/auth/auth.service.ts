import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/email/email.service';
import { JwtService } from '@nestjs/jwt';

import * as b from 'bcrypt';
import { randomBytes, createHash } from 'crypto';

import { SignUpDto } from './dto/SignUp.dto';
import { SignInDto } from './dto/SignIn.dto';
import { PayloadDto } from './dto/Payload.dto';
import { ForgotPasswordDto } from './dto/ForgotPassword.dto';
import { ResetPasswordDto } from './dto/ResetPassword.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  async signup(dto: SignUpDto) {
    try {
      const hashedPassword = await b.hash(dto.password, 8);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.userName,
          password: hashedPassword,
          status: 'PENDING',
        },
      });

      return user;
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

    if (user.status === 'PENDING') {
      throw new UnauthorizedException({
        message: 'Sua conta ainda está pendente de aprovação',
      });
    } else if (user.status === 'REJECTED') {
      throw new ForbiddenException({
        message: 'Sua conta foi rejeitada',
      });
    }

    return this.signToken({ sub: user.id, email: user.email, role: user.role, name: user.name });
  }

  signToken({ sub, email, role, name }: PayloadDto) {
    const payload = {
      sub: sub,
      email: email,
      role: role,
      name: name,
    };

    const token = this.jwt.sign(payload);

    return {
      access_token: token,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      return {
        message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação',
      };
    }

    const token = randomBytes(32).toString('hex');

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
        },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt,
        },
      }),
    ]);

    await this.email.sendPasswordReset(user.email, token);

    return {
      message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new ForbiddenException({
        message: 'Token inválido ou expirado.',
      });
    }

    const hashedPassword = await b.hash(dto.password, 8);

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          usedAt: new Date(),
        },
      });

      if (result.count === 0) {
        throw new ForbiddenException({
          message: 'Token inválido ou expirado',
        });
      }

      await tx.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          password: hashedPassword,
        },
      });

      await tx.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          id: {
            not: resetToken.id,
          },
        },
      });
    });

    return {
      message: 'Senha redefinida com sucesso',
    };
  }
}
