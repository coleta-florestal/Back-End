import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import CreateUserDto from './dto/CreateUser.dto';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}
    async createUser(dto: CreateUserDto) {
        if (dto.password !== dto.confirmPassword) {
            throw new Error('Passwords do not match');
        }
        return await this.prisma.user.create({
            data: {
                username: dto.userName,
                email: dto.email,
                password: dto.password,
            }
        })
    }
}