import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service';

import { SignUpDto } from './dto/SignUp.dto';
import { SignInDto } from './dto/SignIn.dto';

import { Public } from './decorator/public.decorator';
import { ForgotPasswordDto } from './dto/ForgotPassword.dto';
import { ResetPasswordDto } from './dto/ResetPassword.dto';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignUpDto) {
    return this.authService.signup(dto);
  }

  @Post('signin')
  signIn(@Body() dto: SignInDto) {
    return this.authService.singin(dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
