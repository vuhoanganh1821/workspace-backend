import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { FilterSprintDto } from './dto/filter-sprint.dto';
import { TeamMemberProgressDto } from './dto/team-member-progress.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { UserDetailProgressDto } from './dto/user-detail-progress.dto';
import { SprintsService } from './sprints.service';

@Controller('sprints')
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
  create(@Body() createSprintDto: CreateSprintDto) {
    return this.sprintsService.create(createSprintDto);
  }

  @Post('filter')
  findAll(@Body() filter?: FilterSprintDto) {
    return this.sprintsService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sprintsService.findOne(id);
  }

  @Get(':id/progress')
  getCurrentSprintProgress(@Param('id') id: string) {
    return this.sprintsService.getCurrentSprintProgress(id);
  }

  @Get(':sprintId/users/progress')
  getTeamProgress(
    @Param('sprintId') sprintId: string,
  ): Promise<TeamMemberProgressDto[]> {
    return this.sprintsService.getTeamProgress(sprintId);
  }

  @Get(':sprintId/users/:userId/progress')
  getUserDetailProgress(
    @Param('sprintId') sprintId: string,
    @Param('userId') userId: string,
  ): Promise<UserDetailProgressDto> {
    const sprintObjectId = new Types.ObjectId(sprintId);
    const userObjectId = new Types.ObjectId(userId);

    return this.sprintsService.getUserDetailProgress(
      sprintObjectId,
      userObjectId,
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSprintDto: UpdateSprintDto) {
    return this.sprintsService.update(id, updateSprintDto);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string) {
    return this.sprintsService.completeSprint(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sprintsService.remove(id);
  }
}
