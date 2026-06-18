import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUserId } from 'src/common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getProfile(@CurrentUserId() userId: string) {
    return this.usersService.findOne(userId);
  }

  @Get('managed-users')
  getMyManagedUsers(@CurrentUserId() userId: string) {
    return this.usersService.getMyManagedUsers(userId);
  }

  @Get('managed-projects')
  getMyManagedProjects(@CurrentUserId() userId: string) {
    return this.usersService.getMyManagedProjects(userId);
  }

  @Get('projects')
  getMyProjects(@CurrentUserId() userId: string) {
    return this.usersService.getMyProjects(userId);
  }
}
