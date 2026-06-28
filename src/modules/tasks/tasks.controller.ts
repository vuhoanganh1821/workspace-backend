import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from 'src/common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.tasksService.findTasksByProject(projectId);
  }

  @Get()
  findBySprint(@Query('sprintId') sprintId: string) {
    return this.tasksService.findTasksBySprint(sprintId);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.tasksService.findTasksByUser(userId);
  }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Get(':id/histories')
  getTaskHistories(@Param('id') id: string) {
    return this.tasksService.getHistories(id);
  }

  @Get(':id/comments')
  getTaskComments(@Param('id') id: string) {
    return this.tasksService.getComments(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUserId() userId: string,
  ) {
    return this.tasksService.update(id, updateTaskDto, userId);
  }

  @Patch(':id/move')
  moveTask(@Param('id') id: string, @Body() moveTaskDto: MoveTaskDto) {
    return this.tasksService.moveTask(id, moveTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
