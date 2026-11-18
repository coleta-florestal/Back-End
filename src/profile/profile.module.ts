import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';

@Module({
  imports: [AuthModule],
  providers: [ProfileService],
  controllers: [ProfileController],
})
export class ProfileModule {}
