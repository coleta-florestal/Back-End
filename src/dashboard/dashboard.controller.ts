import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { DashboardService } from './dashboard.service';

import { GetUser } from 'src/auth/decorator/currentUser.decorator';
import { AuthRequest } from 'src/auth/types/auth-user';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':farmId')
  getFarmDashboard(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @GetUser() user: NonNullable<AuthRequest['user']>,
  ) {
    return this.dashboardService.getFarmDashboard(farmId, user);
  }
}
