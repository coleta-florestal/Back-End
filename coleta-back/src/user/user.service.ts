import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import SignUpDto from './dto/SignUp.dto';
import SignInDto from './dto/SignIn.dto';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    async signUp(dto: SignUpDto) {
        if (dto.password !== dto.confirmPassword) {
            throw new Error('Passwords do not match');
        }
        return await this.prisma.user.create({
            data: {
                name: dto.userName,
                email: dto.email,
                password: dto.password,
            }
        })
    }

    async signIn(dto: SignInDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        })
        
        if(!user) {
            throw new Error("Email or Password not valid")
        }

        if(user.password !== dto.password) {
            throw new Error("Email or password not valid")
        }

        return user
    }
}