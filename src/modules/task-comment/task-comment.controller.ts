import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto';
import { TaskCommentService } from './task-comment.service';

@Controller('task-comments')
export class TaskCommentController {
  constructor(private readonly taskCommentService: TaskCommentService) {}

  @Post()
  create(@Body() createTaskCommentDto: CreateTaskCommentDto) {
    return this.taskCommentService.create(createTaskCommentDto);
  }

  @Get()
  findAll() {
    return this.taskCommentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskCommentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskCommentDto: UpdateTaskCommentDto,
  ) {
    return this.taskCommentService.update(id, updateTaskCommentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskCommentService.remove(id);
  }
}
