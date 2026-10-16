import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SignUpDto } from './dto/SignUp.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as b from "bcrypt"
import { SignInDto } from './dto/SignIn.dto';


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
    }

    async singin(dto: SignInDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        })
        
        if (!user) {
            throw new UnauthorizedException({
                message: "Invalid credentials"
            })
        }

        const passwordMatches = await b.compare(dto.password, user.password)

        if(!passwordMatches) {
            throw new UnauthorizedException({
                message: "Invalid credentials"
            })
        }

        return user
    }
}
