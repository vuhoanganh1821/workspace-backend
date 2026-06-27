import { Injectable } from '@nestjs/common';
import { CreateTaskHistoryDto } from './dto/create-task-history.dto';
import { UpdateTaskHistoryDto } from './dto/update-task-history.dto';

@Injectable()
export class TaskHistoryService {
  create(createDto: CreateTaskHistoryDto) {
    return 'This action adds a new taskHistory';
  }

  findAll() {
    return `This action returns all taskHistory`;
  }

  findOne(id: string) {
    return `This action returns a #${id} taskHistory`;
  }

  update(id: string, updateDto: UpdateTaskHistoryDto) {
    return `This action updates a #${id} taskHistory`;
  }

  remove(id: string) {
    return `This action removes a #${id} taskHistory`;
  }
}
