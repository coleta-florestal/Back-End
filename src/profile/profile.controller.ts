import { Body, Controller, Patch } from '@nestjs/common';

import type { User } from 'src/generated/prisma/client';
import { GetUser } from 'src/auth/decorator/currentUser.decorator';

import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/UpdateProfile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Patch('update')
  updateProfile(@GetUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(user.id, dto);
  }
}
