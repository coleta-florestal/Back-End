import { ForbiddenException, Injectable } from '@nestjs/common';
import { SignUpDto } from './dto/SignUp.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as b from "bcrypt"


@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) {}

    async signup(dto: SignUpDto) {
        try {
            const hashedPassword = await b.hash(dto.password, 8)
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    name: dto.userName,
                    password: hashedPassword
                }
            })
            return user
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === "P2002") {
                    throw new ForbiddenException({
                        message: "This email has been already used"
                    })
                }
            }
            throw error
        }
        return "ok"
    }
}
