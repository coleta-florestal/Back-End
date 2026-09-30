import { Body, Controller, Post } from '@nestjs/common';
import SignInDto from 'src/user/dto/SignIn.dto';
import SignUpDto from 'src/user/dto/SignUp.dto';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly userService: UserService) {}

    @Post('signup')
    signup(@Body() dto: SignUpDto) {
        return this.userService.signUp(dto)
    }

    @Post('signin')
    signIn(@Body() dto: SignInDto) {
        return this.userService.signIn(dto)
    }
}
