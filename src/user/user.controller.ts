import { Controller, Get } from '@nestjs/common';
import { GetUser } from 'src/auth/decorator/currentUser.decorator';
import { Public } from 'src/auth/decorator/public.decorator';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role, type User } from 'src/generated/prisma/client';

@Controller('user')
export class UserController {
  @Public()
  @Get('me')
  getme() {
    return 'publico';
  }

  @Get('autenticado')
  getAuthenticated() {
    return 'autenticado';
  }

  @Roles(Role.USER)
  @Get('autorizado')
  getAutorized(@GetUser() user: User) {
    return user;
  }
}
