import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskComment, TaskCommentSchema } from './entities/task-comment.entity';
import { TaskCommentController } from './task-comment.controller';
import { TaskCommentService } from './task-comment.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaskComment.name, schema: TaskCommentSchema },
    ]),
  ],
  controllers: [TaskCommentController],
  providers: [TaskCommentService],
})
export class TaskCommentModule {}
