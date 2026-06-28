import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto';
import {
  TaskComment,
  TaskCommentDocument,
} from './entities/task-comment.entity';

@Injectable()
export class TaskCommentService {
  constructor(
    @InjectModel(TaskComment.name)
    private taskCommentModel: Model<TaskCommentDocument>,
  ) {}

  create(createDto: CreateTaskCommentDto) {
    const { taskId, userId, message } = createDto;

    return this.taskCommentModel.create({
      taskId: new Types.ObjectId(taskId),
      userId: new Types.ObjectId(userId),
      message,
    });
  }

  findAll() {
    return `This action returns all taskComment`;
  }

  findOne(id: string) {
    return `This action returns a #${id} taskComment`;
  }

  update(id: string, updateDto: UpdateTaskCommentDto) {
    return `This action updates a #${id} taskComment`;
  }

  remove(id: string) {
    return `This action removes a #${id} taskComment`;
  }
}
