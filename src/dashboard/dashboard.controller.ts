import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':farmId')
  getFarmDashboard(@Param('farmId', ParseUUIDPipe) farmId: string) {
    return this.dashboardService.getFarmDashboard(farmId);
  }
}
