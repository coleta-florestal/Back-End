import { Body, Controller, Get, Patch } from '@nestjs/common';

import type { User } from 'src/generated/prisma/client';
import { GetUser } from 'src/auth/decorator/currentUser.decorator';

import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/UpdateProfile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  me(@GetUser() user: User) {
    return user;
  }

  @Patch('update')
  updateProfile(@GetUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(user.id, dto);
  }
}
