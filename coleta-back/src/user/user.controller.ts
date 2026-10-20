import { Controller, ForbiddenException, Get, Req, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorator/currentUser.decorator';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import type { User } from 'src/generated/prisma/client';

@Controller('user')
export class UserController {
    
    @UseGuards(JwtGuard)
    @Get("me")
    getme(@GetUser() user: User) {
        if (user.role !== "ADMIN") {
            throw new ForbiddenException()
        }
        return user
    }
}
