import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import SignUpDto from './dto/SignUp.dto';
import SignInDto from './dto/SignIn.dto';
import * as b from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async signUp(dto: SignUpDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const hashedPassword = await b.hash(dto.password, 10);

    return await this.prisma.user.create({
      data: {
        name: dto.userName,
        email: dto.email,
        password: hashedPassword,
      },
    });
  }

  async signIn(dto: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new Error('Email or Password not valid');
    }

    const passwordMatch = await b.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Email or password not valid');
    }

    return user;
  }
}
