import { Body, Controller, Post } from '@nestjs/common';
import { SignUpDto } from './dto/SignUp.dto';
import { SignInDto } from './dto/SignIn.dto';
import { AuthService } from './auth.service';
import { Public } from './decorator/public.decorator';

@Public()
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('signup')
    signup(@Body() dto: SignUpDto) {
        return this.authService.signup(dto)
    }

    @Post('signin')
    signIn(@Body() dto: SignInDto) {
        return this.authService.singin(dto)
    }
}
