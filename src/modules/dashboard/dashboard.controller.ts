import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUserId } from 'src/common/current-user.decorator';
import { JwtAuthGuard } from 'src/common/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('admin/projects')
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('projects/:projectId')
  getUserDashboard(
    @CurrentUserId() userId: string,
    @Param('projectId') projectId: string = 'all',
  ) {
    return this.dashboardService.getUserDashboard(userId, projectId);
  }
}
