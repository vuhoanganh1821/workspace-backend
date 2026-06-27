import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CreateTaskHistoryDto } from './dto/create-task-history.dto';
import { UpdateTaskHistoryDto } from './dto/update-task-history.dto';
import { TaskHistoryService } from './task-history.service';

@Controller('task-histories')
export class TaskHistoryController {
  constructor(private readonly taskHistoryService: TaskHistoryService) {}

  @Post()
  create(@Body() createTaskHistoryDto: CreateTaskHistoryDto) {
    return this.taskHistoryService.create(createTaskHistoryDto);
  }

  @Get()
  findAll() {
    return this.taskHistoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskHistoryService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskHistoryDto: UpdateTaskHistoryDto,
  ) {
    return this.taskHistoryService.update(id, updateTaskHistoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskHistoryService.remove(id);
  }
}
