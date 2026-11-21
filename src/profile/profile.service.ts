import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';

import * as b from "bcrypt"

import { UpdateProfileDto } from './dto/UpdateProfile.dto';

interface Data {
  name?: string,
  email?: string,
  password?: string
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async updateProfile(userId: string, { email, name, password }: UpdateProfileDto) {
    try {

      const data: Data = {
        email: email,
        name: name
      }
      
      if (password) {
        data.password = await b.hash(password, 8)
      }
      
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: data.email,
          name: data.name,
          password: data.password,
        },
      });

      return this.authService.signToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ForbiddenException({ message: 'Esse email já está sendo usado' });
      }
      throw error;
    }
  }
}
