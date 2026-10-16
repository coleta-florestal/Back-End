import { Body, Controller, Post } from '@nestjs/common';
import { SignUpDto } from './dto/SignUp.dto';
import { SignInDto } from './dto/SignIn.dto';


@Controller('auth')
export class AuthController {
    constructor() {}

    @Post('signup')
    signup(@Body() dto: SignUpDto) {
        return "ok"
    }

    @Post('signin')
    signIn(@Body() dto: SignInDto) {
        return "ok"
    }
}
